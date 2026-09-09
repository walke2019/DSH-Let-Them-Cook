from pathlib import Path
p=Path('src/engine/model-settings.ts');s=p.read_text(encoding='utf-8-sig')
s=s.replace('import type {ModelRef, ResiliencePolicy} from \'../types.js\'','import type {ModelRef, ResiliencePolicy} from \'../types.js\'\nconst MAX_RECENT_MODELS = 6')
s=s.replace('this.data=data\n    }', 'this.data={...data,recent:data.recent.slice(0,MAX_RECENT_MODELS)}\n    }')
s=s.replace('recent(){return this.data.recent.slice()}', 'recent(){return this.data.recent.slice(0,MAX_RECENT_MODELS)}')
s=s.replace('].slice(0,20)', '].slice(0,MAX_RECENT_MODELS)')
s=s.replace(').slice(0,20)', ').slice(0,MAX_RECENT_MODELS)')
p.write_text(s,encoding='utf-8')
