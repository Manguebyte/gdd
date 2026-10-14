"""PixelLab MCP bridge. Credentials stay in the user's existing Claude config.

Usage: python pixellab.py list | schema TOOL | call TOOL arguments.json
"""
import json
import pathlib
import sys
import urllib.request


def connection():
    config = json.loads((pathlib.Path.home() / '.claude.json').read_text('utf-8'))
    project = config.get('projects', {}).get('C:/Users/abraao.nova/Documents/MangueByteGames/GDD', {})
    server = project.get('mcpServers', {}).get('pixellab', {})
    if not server.get('headers'):
        raise RuntimeError('PixelLab needs to be connected in the local MCP configuration.')
    return server['url'], server['headers']


def rpc(method, params):
    endpoint, auth = connection()
    payload = json.dumps({'jsonrpc': '2.0', 'id': 1, 'method': method, 'params': params}).encode()
    headers = {**auth, 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream'}
    request = urllib.request.Request(endpoint, data=payload, headers=headers)
    with urllib.request.urlopen(request, timeout=55) as response:
        body = response.read().decode()
    if body.lstrip().startswith('{'):
        data = json.loads(body)
    else:
        data = json.loads(next(line[6:] for line in body.splitlines() if line.startswith('data: ')))
    if 'error' in data:
        raise RuntimeError(data['error'].get('message', 'PixelLab request failed'))
    return data['result']


def main():
    command = sys.argv[1]
    if command in ('list', 'schema'):
        tools = rpc('tools/list', {}).get('tools', [])
        result = [{'name': t['name'], 'description': t.get('description', '')[:150]} for t in tools] if command == 'list' else next(t for t in tools if t['name'] == sys.argv[2])
    else:
        arguments = json.loads(pathlib.Path(sys.argv[3]).read_text('utf-8'))
        result = rpc('tools/call', {'name': sys.argv[2], 'arguments': arguments})
    if isinstance(result, dict) and 'content' in result:
        result['content'] = [block if block.get('type') != 'image' else {'type': 'image', 'mimeType': block.get('mimeType'), 'preview_omitted': True} for block in result['content']]
    print(json.dumps(result, ensure_ascii=True))


if __name__ == '__main__':
    main()
