import json
import os
import psycopg2

def handler(event: dict, context) -> dict:
    """Управление проектами пользователя в DIsol"""
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Authorization',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        
        if method == 'GET':
            params = event.get('queryStringParameters', {})
            user_id = params.get('user_id')
            project_type = params.get('type')
            
            if not user_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'user_id обязателен'}),
                    'isBase64Encoded': False
                }
            
            if project_type:
                cur.execute(
                    "SELECT id, title, type, content, language, metadata, created_at FROM projects WHERE user_id = %s AND type = %s ORDER BY created_at DESC",
                    (user_id, project_type)
                )
            else:
                cur.execute(
                    "SELECT id, title, type, content, language, metadata, created_at FROM projects WHERE user_id = %s ORDER BY created_at DESC",
                    (user_id,)
                )
            
            projects = []
            for proj_id, title, ptype, content, language, metadata, created_at in cur.fetchall():
                projects.append({
                    'id': proj_id,
                    'title': title,
                    'type': ptype,
                    'content': content,
                    'language': language,
                    'metadata': metadata,
                    'created_at': created_at.isoformat()
                })
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'projects': projects}),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            data = json.loads(event.get('body', '{}'))
            user_id = data.get('user_id')
            title = data.get('title', 'Новый проект')
            project_type = data.get('type', 'code')
            content = data.get('content', '')
            language = data.get('language')
            metadata = data.get('metadata', {})
            
            if not user_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'user_id обязателен'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                "INSERT INTO projects (user_id, title, type, content, language, metadata) VALUES (%s, %s, %s, %s, %s, %s) RETURNING id",
                (user_id, title, project_type, content, language, json.dumps(metadata))
            )
            project_id = cur.fetchone()[0]
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'project_id': project_id
                }),
                'isBase64Encoded': False
            }
        
        else:
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'}),
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
