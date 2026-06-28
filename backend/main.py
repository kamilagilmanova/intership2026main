from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import json
import os
from google import genai
from google.genai import types

app = FastAPI()

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Инициализация клиента Gemini с твоим рабочим ключом
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "AQ.Ab8RN6LNNgF0S0brKpBvZxKEpv664qDHletj41hZJyaLEDkqEA")

# Принудительно заставляем клиент работать через REST API вместо gRPC
client = genai.Client(
    api_key=GEMINI_API_KEY,
    http_options={'api_version': 'v1beta'}
)

# Структура данных для фронтенда
class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    correct: int

class AIAnalysisResult(BaseModel):
    topic: str
    summary: List[str]
    terms: List[str]
    quiz: List[QuizQuestion]

@app.get("/")
def read_root():
    return {"message": "Привет! Бэкенд LectaAI работает!"}

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        # Читаем содержимое файла
        contents = await file.read()
        
        if not contents:
            raise HTTPException(status_code=400, detail="Файл пуст")

        # Определяем, что нам пришло: картинка или текст
        content_type = file.content_type
        
        # Базовый промпт для ИИ
        system_prompt = "Ты — опытный методист образования. Тщательно проанализируй предоставленный учебный материал. Выдели главную тему лекции, основные тезисы и ключевые термины, а также составь интерактивный тест (quiz) ровно из 5 вопросов на русском языке."

        if content_type.startswith("image/"):
            # Если это картинка, передаем её структуру в виде байтов
            contents_to_send = [
                types.Part.from_bytes(data=contents, mime_type=content_type),
                "Проанализируй этот учебный материал с изображения и выдели главное согласно структуре формата."
            ]
        else:
            # Если это текстовый файл (.txt)
            user_text = contents.decode("utf-8")
            if not user_text.strip():
                raise HTTPException(status_code=400, detail="Текстовый файл пуст")
            
            contents_to_send = f"Проанализируй учебный текст:\n{user_text}"

        # Делаем запрос к модели gemini-2.5-flash
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=contents_to_send,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=AIAnalysisResult,
                system_instruction=system_prompt
            ),
        )

        # Возвращаем структурированный JSON фронтенду
        return json.loads(response.text)

    except Exception as e:
        print(f"Произошла ошибка во время запроса: {e}")
        raise HTTPException(status_code=500, detail=str(e))