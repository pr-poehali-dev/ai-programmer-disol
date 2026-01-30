import json
import os
import psycopg2
from openai import OpenAI

def handler(event: dict, context) -> dict:
    """Чат с ИИ Тимур - создание кода, изображений и видео"""
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Authorization',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    try:
        if method == 'POST':
            data = json.loads(event.get('body', '{}'))
            user_id = data.get('user_id')
            session_id = data.get('session_id')
            message = data.get('message', '')
            message_type = data.get('type', 'text')
            
            if not user_id or not message:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'user_id и message обязательны'}),
                    'isBase64Encoded': False
                }
            
            conn = psycopg2.connect(os.environ['DATABASE_URL'])
            cur = conn.cursor()
            
            if not session_id:
                cur.execute(
                    "INSERT INTO chat_sessions (user_id, title) VALUES (%s, %s) RETURNING id",
                    (user_id, message[:50])
                )
                session_id = cur.fetchone()[0]
                conn.commit()
            
            cur.execute(
                "INSERT INTO chat_messages (session_id, role, content) VALUES (%s, %s, %s)",
                (session_id, 'user', message)
            )
            conn.commit()
            
            client = OpenAI(api_key=os.environ.get('OPENAI_API_KEY'))
            
            system_prompt = """Ты - Тимур, ИИ-программист полного цикла. 
Ты можешь:
- Создавать код для веб-приложений (React, Python, Node.js)
- Разрабатывать мобильные приложения (React Native, Flutter)
- Писать backend API
- Генерировать HTML/CSS/JavaScript
- Давать советы по архитектуре и best practices

Отвечай профессионально, но дружелюбно. Всегда предлагай готовые решения с кодом."""
            
            cur.execute(
                "SELECT role, content FROM chat_messages WHERE session_id = %s ORDER BY created_at DESC LIMIT 10",
                (session_id,)
            )
            history = cur.fetchall()
            
            messages = [{"role": "system", "content": system_prompt}]
            for role, content in reversed(history):
                messages.append({"role": role, "content": content})
            
            response = client.chat.completions.create(
                model="gpt-4",
                messages=messages,
                temperature=0.7,
                max_tokens=2000
            )
            
            ai_message = response.choices[0].message.content
            
            cur.execute(
                "INSERT INTO chat_messages (session_id, role, content) VALUES (%s, %s, %s)",
                (session_id, 'assistant', ai_message)
            )
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'session_id': session_id,
                    'message': ai_message
                }),
                'isBase64Encoded': False
            }
        
        elif method == 'GET':
            params = event.get('queryStringParameters', {})
            user_id = params.get('user_id')
            session_id = params.get('session_id')
            
            if not user_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'user_id обязателен'}),
                    'isBase64Encoded': False
                }
            
            conn = psycopg2.connect(os.environ['DATABASE_URL'])
            cur = conn.cursor()
            
            if session_id:
                cur.execute(
                    "SELECT id, role, content, created_at FROM chat_messages WHERE session_id = %s ORDER BY created_at ASC",
                    (session_id,)
                )
                messages = []
                for msg_id, role, content, created_at in cur.fetchall():
                    messages.append({
                        'id': msg_id,
                        'role': role,
                        'content': content,
                        'created_at': created_at.isoformat()
                    })
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'messages': messages}),
                    'isBase64Encoded': False
                }
            else:
                cur.execute(
                    "SELECT id, title, created_at FROM chat_sessions WHERE user_id = %s ORDER BY updated_at DESC",
                    (user_id,)
                )
                sessions = []
                for sess_id, title, created_at in cur.fetchall():
                    sessions.append({
                        'id': sess_id,
                        'title': title,
                        'created_at': created_at.isoformat()
                    })
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'sessions': sessions}),
                    'isBase64Encoded': False
                }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()
