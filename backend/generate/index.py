import json
import os
import base64
import psycopg2
import boto3
from openai import OpenAI
import requests

def handler(event: dict, context) -> dict:
    """Генерация изображений, видео и кода через ИИ Тимур"""
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Authorization',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    try:
        data = json.loads(event.get('body', '{}'))
        user_id = data.get('user_id')
        gen_type = data.get('type')
        prompt = data.get('prompt', '')
        
        if not user_id or not gen_type or not prompt:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'user_id, type и prompt обязательны'}),
                'isBase64Encoded': False
            }
        
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        
        if gen_type == 'image':
            stability_key = os.environ.get('STABILITY_API_KEY')
            if not stability_key:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Необходим STABILITY_API_KEY'}),
                    'isBase64Encoded': False
                }
            
            response = requests.post(
                "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image",
                headers={
                    "Authorization": f"Bearer {stability_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "text_prompts": [{"text": prompt}],
                    "cfg_scale": 7,
                    "height": 1024,
                    "width": 1024,
                    "samples": 1,
                    "steps": 30
                }
            )
            
            if response.status_code != 200:
                return {
                    'statusCode': 500,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Ошибка генерации изображения'}),
                    'isBase64Encoded': False
                }
            
            image_data = response.json()['artifacts'][0]['base64']
            image_bytes = base64.b64decode(image_data)
            
            s3 = boto3.client('s3',
                endpoint_url='https://bucket.poehali.dev',
                aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
                aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY']
            )
            
            filename = f"images/{user_id}_{context.request_id}.png"
            s3.put_object(Bucket='files', Key=filename, Body=image_bytes, ContentType='image/png')
            
            cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{filename}"
            
            cur.execute(
                "INSERT INTO projects (user_id, title, type, content, metadata) VALUES (%s, %s, %s, %s, %s) RETURNING id",
                (user_id, prompt[:100], 'image', cdn_url, json.dumps({'format': 'PNG', 'size': '1024x1024'}))
            )
            project_id = cur.fetchone()[0]
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'type': 'image',
                    'url': cdn_url,
                    'project_id': project_id
                }),
                'isBase64Encoded': False
            }
        
        elif gen_type == 'code':
            client = OpenAI(api_key=os.environ.get('OPENAI_API_KEY'))
            
            response = client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "Ты Тимур - эксперт программист. Создай чистый, рабочий код по запросу. Отвечай только кодом без пояснений."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=3000
            )
            
            code = response.choices[0].message.content
            
            language = 'javascript'
            if 'python' in prompt.lower():
                language = 'python'
            elif 'typescript' in prompt.lower() or 'tsx' in prompt.lower():
                language = 'typescript'
            
            cur.execute(
                "INSERT INTO projects (user_id, title, type, content, language, metadata) VALUES (%s, %s, %s, %s, %s, %s) RETURNING id",
                (user_id, prompt[:100], 'code', code, language, json.dumps({'lines': code.count('\n')}))
            )
            project_id = cur.fetchone()[0]
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'type': 'code',
                    'code': code,
                    'language': language,
                    'project_id': project_id
                }),
                'isBase64Encoded': False
            }
        
        elif gen_type == 'video':
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'type': 'video',
                    'message': 'Генерация видео - функция в разработке. Доступна в следующем обновлении.'
                }),
                'isBase64Encoded': False
            }
        
        else:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Неизвестный тип генерации'}),
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
