/* admin-editor.js — লেখার সম্পাদক (বোল্ড, ইটালিক, হাইলাইট, শিরোনাম, তালিকা, লিংক) — আপনার আসল কোড */
(function(){
  var artBody = document.getElementById('art-body');
  var toolbar = document.getElementById('art-toolbar');
  if(!toolbar || !artBody) return;

  function applyHighlight(){
    var sel = window.getSelection();
    if(!sel || !sel.rangeCount || sel.isCollapsed) return;
    var range = sel.getRangeAt(0);
    if(!artBody.contains(range.commonAncestorContainer)) return;
    var mark = document.createElement('mark');
    mark.className = 'rte-highlight';
    try{
      range.surroundContents(mark);
    }catch(e){
      var frag = range.extractContents();
      mark.appendChild(frag);
      range.insertNode(mark);
    }
    sel.removeAllRanges();
    var newRange = document.createRange();
    newRange.selectNodeContents(mark);
    sel.addRange(newRange);
  }

  function insertLink(){
    var sel = window.getSelection();
    if(!sel || !sel.rangeCount || sel.isCollapsed){
      alert('প্রথমে যে টেক্সটে লিংক যুক্ত করতে চান সেটা সিলেক্ট করুন।');
      return;
    }
    var url = prompt('লিংক (URL) লিখুন:', 'https://');
    if(!url) return;
    document.execCommand('createLink', false, url);
  }

  toolbar.querySelectorAll('button[data-cmd]').forEach(function(btn){
    btn.addEventListener('mousedown', function(e){ e.preventDefault(); }); /* সিলেকশন হারানো ঠেকানোর জন্য */
    btn.addEventListener('click', function(){
      artBody.focus();
      var cmd = this.dataset.cmd;
      if(cmd === 'highlight'){ applyHighlight(); }
      else if(cmd === 'createLink'){ insertLink(); }
      else if(cmd === 'formatBlock'){ document.execCommand('formatBlock', false, '<'+this.dataset.value+'>'); }
      else{ document.execCommand(cmd, false, this.dataset.value || null); }
      updateToolbarState();
    });
  });

  function updateToolbarState(){
    var checks = { bold:'bold', italic:'italic', underline:'underline', insertUnorderedList:'insertUnorderedList', insertOrderedList:'insertOrderedList' };
    Object.keys(checks).forEach(function(cmd){
      var btn = toolbar.querySelector('button[data-cmd="'+cmd+'"]');
      if(!btn) return;
      var active = false;
      try{ active = document.queryCommandState(checks[cmd]); }catch(e){}
      btn.classList.toggle('is-active', !!active);
    });
    var blockBtns = toolbar.querySelectorAll('button[data-cmd="formatBlock"]');
    var curBlock = '';
    try{ curBlock = (document.queryCommandValue('formatBlock') || '').toLowerCase(); }catch(e){}
    blockBtns.forEach(function(b){ b.classList.toggle('is-active', curBlock === b.dataset.value); });
  }

  document.addEventListener('selectionchange', function(){
    var sel = window.getSelection();
    if(sel && sel.anchorNode && artBody.contains(sel.anchorNode)){ updateToolbarState(); }
  });
  artBody.addEventListener('keyup', updateToolbarState);
  artBody.addEventListener('mouseup', updateToolbarState);
})();
