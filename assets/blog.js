/* Blog engine. Posts live in /posts: one markdown file per post plus posts/posts.json (the list).
   Nothing shows until posts.json has at least one post that isn't a draft and whose date has arrived.
   With none, /blog/ and /blog/post.html send visitors home and the homepage keeps the Blog link hidden. */
(function(){
  var LIST = '/posts/posts.json';

  function today(){ var d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }

  function loadPosts(){
    return fetch(LIST, {cache:'no-cache'}).then(function(r){ if(!r.ok) throw new Error(r.status); return r.json(); })
      .then(function(data){
        var t = today();
        return (data.posts||[]).filter(function(p){
          return p && p.slug && p.title && p.date && !p.draft && p.date <= t && /^[a-z0-9-]+$/.test(p.slug);
        }).sort(function(a,b){ return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });
      });
  }

  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function safeUrl(u){ u=String(u||'').trim(); return /^(https?:\/\/|\/|#|mailto:)/i.test(u) || /^[\w.\/-]+$/.test(u) ? u : '#'; }

  function inline(s){
    s = esc(s);
    s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, function(_,a,u){ return '<img src="'+safeUrl(u)+'" alt="'+a+'" loading="lazy">'; });
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function(_,t,u){ u=safeUrl(u); var ext=/^https?:/i.test(u); return '<a href="'+u+'"'+(ext?' target="_blank" rel="noopener"':'')+'>'+t+'</a>'; });
    s = s.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/(^|[^*])\*([^*]+)\*/g,'$1<em>$2</em>').replace(/`([^`]+)`/g,'<code>$1</code>');
    return s;
  }

  /* Small markdown: # / ## / ### headings, paragraphs, **bold**, *italic*, [links](url), ![images](url), - lists, 1. lists, > quotes, --- */
  function md(src){
    var lines = String(src).replace(/\r/g,'').replace(/^---\n[\s\S]*?\n---\n/,'').split('\n'), out=[], para=[], list=null;
    function flush(){ if(para.length){ out.push('<p>'+inline(para.join(' '))+'</p>'); para=[]; } if(list){ out.push('</'+list+'>'); list=null; } }
    lines.forEach(function(l){
      var m;
      if(!l.trim()){ flush(); return; }
      if(/^---+$/.test(l.trim())){ flush(); out.push('<hr>'); return; }
      if((m=l.match(/^(#{1,3})\s+(.*)/))){ flush(); var n=Math.min(m[1].length+1,3); out.push('<h'+n+'>'+inline(m[2])+'</h'+n+'>'); return; }
      if((m=l.match(/^>\s?(.*)/))){ flush(); out.push('<blockquote>'+inline(m[1])+'</blockquote>'); return; }
      if((m=l.match(/^\s*([-*]|\d+\.)\s+(.*)/))){
        var kind = /\d/.test(m[1]) ? 'ol' : 'ul';
        if(para.length){ out.push('<p>'+inline(para.join(' '))+'</p>'); para=[]; }
        if(list!==kind){ if(list) out.push('</'+list+'>'); out.push('<'+kind+'>'); list=kind; }
        out.push('<li>'+inline(m[2])+'</li>'); return;
      }
      if(list){ out.push('</'+list+'>'); list=null; }
      para.push(l.trim());
    });
    flush();
    return out.join('\n');
  }

  function niceDate(iso){ var p=iso.split('-'); return new Date(+p[0],+p[1]-1,+p[2]).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}); }

  window.DuhBlog = {loadPosts:loadPosts, md:md, esc:esc, safeUrl:safeUrl, niceDate:niceDate};
})();
