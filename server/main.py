import numpy as np
from tensorflow.keras.preprocessing.sequence import pad_sequences
from tensorflow.keras.preprocessing.text import Tokenizer
import tensorflow as tf
from nltk.stem import WordNetLemmatizer
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
import nltk
import emoji
import re
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from textblob import TextBlob
import pickle
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
nltk.download('punkt_tab')

app = FastAPI()

# Configure CORS with more permissive settings for development
app.add_middleware(
    CORSMiddleware,
    # Allow both localhost variants
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Download NLTK resources
nltk.download("punkt")
nltk.download("stopwords")
nltk.download("wordnet")

# Initialize NLP tools
lemmatizer = WordNetLemmatizer()
stop_words = set(stopwords.words("english"))

# Load the saved model and tokenizer
model = tf.keras.models.load_model('./server/models/full_model.h5')
with open('./server/models/tokenizer.pkl', 'rb') as handle:
    tokenizer = pickle.load(handle)

max_len = 50  # Adjust this to match your training configuration


def clean_tweet(text):
    text = emoji.demojize(str(text))  # Convert emojis to text
    text = text.lower()
    text = re.sub(r"http\S+|www\S+", "", text)  # Remove URLs
    text = re.sub(r"@\w+", "", text)  # Remove Mentions
    text = re.sub(r"#", "", text)  # Remove Hashtags
    # Remove special characters but keep emoji text
    text = re.sub(r"[^a-zA-Z\s:]", "", text)
    tokens = word_tokenize(text)
    tokens = [lemmatizer.lemmatize(word)
              for word in tokens if word not in stop_words]
    return " ".join(tokens)


def get_vader_sentiment(text):
    analyzer = SentimentIntensityAnalyzer()
    scores = analyzer.polarity_scores(text)
    return scores


def predict_sentiment(text):
    # Clean and prepare the text
    cleaned = clean_tweet(text)

    # Get deep learning model prediction
    seq = tokenizer.texts_to_sequences([cleaned])
    padded = pad_sequences(seq, maxlen=max_len)
    dl_score = model.predict(padded)[0][0]

    # Get VADER sentiment
    vader_scores = get_vader_sentiment(cleaned)

    # Combine predictions (you can adjust the weights)
    combined_score = (dl_score + vader_scores['compound']) / 2

    sentiment = "Positive" if combined_score > 0 else "Negative"
    return {
        'sentiment': sentiment,
        'dl_score': float(dl_score),
        'vader_scores': vader_scores,
        'combined_score': combined_score
    }


class TextInput(BaseModel):
    text: str


class SentimentResponse(BaseModel):
    score: float
    positive_words: list[str]
    negative_words: list[str]
    tokens: list[str]


@app.post("/analyze", response_model=SentimentResponse)
async def analyze_sentiment(input: TextInput):
    # Get combined sentiment analysis
    sentiment_result = predict_sentiment(input.text)

    # Get TextBlob analysis for word-level sentiment
    blob = TextBlob(input.text)
    words = blob.words
    positive_words = []
    negative_words = []

    for word in words:
        word_sentiment = TextBlob(str(word)).sentiment.polarity
        if word_sentiment > 0:
            positive_words.append(str(word))
        elif word_sentiment < 0:
            negative_words.append(str(word))

    return SentimentResponse(
        score=sentiment_result['combined_score'] *
        10,  # Scale to match frontend display
        positive_words=positive_words,
        negative_words=negative_words,
        tokens=list(map(str, words))
    )
