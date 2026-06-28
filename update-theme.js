const fs = require('fs');
const path = require('path');

const classMap = {
  // Revert my Organic Studio mess
  'bg-white': 'bg-slate-800',
  'text-stone-800': 'text-slate-100',
  'text-stone-700': 'text-slate-200',
  'text-stone-600': 'text-slate-300',
  'text-stone-500': 'text-slate-400',
  'border-stone-200': 'border-slate-700',
  'border-stone-300': 'border-slate-600',
  'bg-amber-50': 'bg-sky-900/30',
  'border-amber-200': 'border-sky-800/30',
  'text-amber-700': 'text-sky-400',
  'ring-amber-500': 'ring-sky-500',
  'bg-amber-600': 'bg-sky-500',
  'hover:bg-amber-700': 'hover:bg-sky-600',
  'border-amber-400': 'border-sky-700',
  'text-red-600': 'text-rose-400',
  'border-red-200': 'border-rose-800',
  'bg-red-600': 'bg-rose-500',
  'bg-stone-600': 'bg-violet-600',
  'hover:bg-stone-700': 'hover:bg-violet-700',
  'from-amber-500': 'from-sky-500',
  'to-orange-400': 'to-cyan-400',
  
  // Fix original light theme colors remaining
  'bg-gray-50': 'bg-slate-900',
  'bg-gray-100': 'bg-slate-800',
  'bg-gray-200': 'bg-slate-800',
  'text-gray-900': 'text-slate-100',
  'text-gray-800': 'text-slate-200',
  'text-gray-700': 'text-slate-300',
  'text-gray-600': 'text-slate-400',
  'text-gray-500': 'text-slate-400',
  'border-gray-200': 'border-slate-700',
  'border-gray-300': 'border-slate-600',
  
  // Replace remaining orange/amber with sky/cyan/teal
  'bg-orange-50': 'bg-sky-900/30',
  'text-orange-600': 'text-sky-400',
  'bg-orange-500': 'bg-sky-500',
  'bg-orange-600': 'bg-sky-600',
  'hover:bg-orange-600': 'hover:bg-sky-600',
  'hover:bg-orange-700': 'hover:bg-sky-700',
  'border-orange-200': 'border-sky-800/30',
  'border-orange-500': 'border-sky-500',
  'focus:ring-orange-500': 'focus:ring-sky-500',
  'text-orange-500': 'text-sky-500',
  'text-amber-600': 'text-teal-400',
  'bg-amber-100': 'bg-teal-900/30',
  'text-amber-800': 'text-teal-300',
};

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let updated = false;
      for (const [oldClass, newClass] of Object.entries(classMap)) {
        const escaped = oldClass.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp('(^|\\s|["\'`])' + escaped + '(?=\\s|["\'`])', 'g');
        if (regex.test(content)) {
          content = content.replace(regex, '$1' + newClass);
          updated = true;
        }
      }
      // Fix Selects not having dark backgrounds
      if (content.includes('<select')) {
        content = content.replace(/<select\s+([^>]*?)className=(["'])(.*?)\2/g, (match, p1, p2, p3) => {
           let classes = p3;
           if (!classes.includes('bg-slate-800')) classes += ' bg-slate-800';
           if (!classes.includes('text-slate-100')) classes += ' text-slate-100';
           return `<select ${p1}className=${p2}${classes}${p2}`;
        });
        
        // Also ensure options have dark background so they are readable on Windows
        if (!content.includes('option className="bg-slate-800"')) {
            content = content.replace(/<option /g, '<option className="bg-slate-800 text-slate-100" ');
        }
        updated = true;
      }

      if (updated) {
        fs.writeFileSync(fullPath, content);
        console.log('Updated ' + fullPath);
      }
    }
  }
}

processDir(path.join(__dirname, 'app'));
processDir(path.join(__dirname, 'components'));
