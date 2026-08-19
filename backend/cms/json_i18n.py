import json
import os
from django.conf import settings

LANGUAGES = ['ru', 'en']

def get_messages_dir():
    return getattr(settings, 'MESSAGES_DIR', os.path.join(settings.BASE_DIR.parent, 'frontend', 'messages'))

def flatten_json(y):
    out = {}
    def flatten(x, name=''):
        if isinstance(x, dict):
            for a in x:
                flatten(x[a], name + a + '.')
        else:
            out[name[:-1]] = x
    flatten(y)
    return out

def unflatten_json(dictionary):
    result = {}
    for key, value in dictionary.items():
        parts = key.split('.')
        d = result
        for part in parts[:-1]:
            d = d.setdefault(part, {})
        d[parts[-1]] = value
    return result

def read_lang(lang):
    filepath = os.path.join(get_messages_dir(), f'{lang}.json')
    if not os.path.exists(filepath):
        return {}
    with open(filepath, encoding='utf-8') as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return {}

def grouped_payload():
    flat = {lang: flatten_json(read_lang(lang)) for lang in LANGUAGES}
    all_keys = set()
    for lang in LANGUAGES:
        all_keys.update(flat[lang].keys())
    groups = {}
    for key in sorted(all_keys):
        parts = key.split('.', 1)
        name = parts[0] if len(parts) > 1 else 'Общие'
        groups.setdefault(name, []).append({
            'key': key,
            'ru': flat['ru'].get(key, ''),
            'en': flat['en'].get(key, ''),
        })
    return {'groups': [{'name': n, 'keys': items} for n, items in groups.items()]}

def write_messages(keys):
    """keys: {full.key: {ru, en}} full snapshot. Unknown extra keys ignored. Missing keys dropped."""
    directory = get_messages_dir()
    os.makedirs(directory, exist_ok=True)
    previous = {lang: read_lang(lang) for lang in LANGUAGES}
    existing_keys = set()
    for lang in LANGUAGES:
        existing_keys.update(flatten_json(previous[lang]).keys())
    new_data = {lang: {} for lang in LANGUAGES}
    for full_key, pair in keys.items():
        if full_key not in existing_keys or not isinstance(pair, dict):
            continue
        for lang in LANGUAGES:
            new_data[lang][full_key] = pair.get(lang, '')
    written = []
    try:
        for lang in LANGUAGES:
            unflattened = unflatten_json(new_data[lang])
            final_path = os.path.join(directory, f'{lang}.json')
            tmp_path = final_path + '.tmp'
            with open(tmp_path, 'w', encoding='utf-8') as f:
                json.dump(unflattened, f, ensure_ascii=False, indent=2)
            os.replace(tmp_path, final_path)
            written.append(lang)
    except Exception:
        for lang in written:
            final_path = os.path.join(directory, f'{lang}.json')
            with open(final_path, 'w', encoding='utf-8') as f:
                json.dump(previous[lang], f, ensure_ascii=False, indent=2)
        raise
