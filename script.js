document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const display = document.getElementById('display');
  const slider = document.getElementById('sliderHours');
  const labelHours = document.getElementById('labelHours');
  const labelLeft = document.getElementById('labelLeft');

  const tabClock = document.getElementById('tabClock');
  const tabStopwatch = document.getElementById('tabStopwatch');
  const tabAlarm = document.getElementById('tabAlarm');
  const tabSettings = document.getElementById('tabSettings');

  const langSelect = document.getElementById('langSelect');
  const stopwatchArea = document.getElementById('stopwatchArea');
  const swStart = document.getElementById('swStart');
  const swLap = document.getElementById('swLap');
  const swReset = document.getElementById('swReset');
  const lapList = document.getElementById('lapList');

  const alarmArea = document.getElementById('alarmArea');
  const alarmTimeInput = document.getElementById('alarmTime');
  const alarmSetBtn = document.getElementById('alarmSetBtn');
  const alarmsContainer = document.getElementById('alarmsContainer');

  const settingsArea = document.getElementById('settingsArea');
  const secondsToggle = document.getElementById('secondsToggle');
  const secondsLabel = document.getElementById('secondsLabel');

  const L = {
    ja:{'tab.clock':'時計','tab.stopwatch':'ストップウォッチ','tab.alarm':'アラーム','tab.settings':'設定',
        'btn.start':'開始','btn.stop':'停止','btn.lap':'ラップ','btn.reset':'リセット','btn.addAlarm':'アラーム追加',
        'label.hours':'1日の長さ','label.hoursValue':'24 時間','settings.showSeconds':'秒数表示','settings.language':'言語',
        'footer':'設定は自動で保存されます。','msg.pickTime':'時刻を選択してください','msg.invalidTime':'不正な時刻です',
        'msg.alarmSound':'アラームが鳴りました','noLaps':'ラップなし','noAlarms':'アラームなし','delete':'削除'},
    en:{'tab.clock':'Clock','tab.stopwatch':'Stopwatch','tab.alarm':'Alarm','tab.settings':'Settings',
        'btn.start':'Start','btn.stop':'Stop','btn.lap':'Lap','btn.reset':'Reset','btn.addAlarm':'Add Alarm',
        'label.hours':'Day length','label.hoursValue':'24 h','settings.showSeconds':'Show seconds','settings.language':'Language',
        'footer':'Settings are saved automatically.','msg.pickTime':'Please pick a time','msg.invalidTime':'Invalid time',
        'msg.alarmSound':'Alarm','noLaps':'No laps','noAlarms':'No alarms','delete':'Delete'}
  };

  let customHours = Number(localStorage.getItem('nclock_hours'))||24;
  let showSeconds = (localStorage.getItem('nclock_show_seconds')==='true')||true;
  let lang = localStorage.getItem('nclock_lang')||'ja';
  let mode = localStorage.getItem('nclock_mode')||'clock';
  let elapsedMs = Number(localStorage.getItem('nclock_sw_elapsed'))||0;
  let laps = JSON.parse(localStorage.getItem('nclock_sw_laps')||'[]');
  let alarms = JSON.parse(localStorage.getItem('nclock_alarms')||'[]');
  let lastTriggered = localStorage.getItem('nclock_last_triggered')||'';

  slider.value = customHours;
  labelHours.textContent = lang==='en'?`${customHours} h`:`${customHours} 時間`;
  secondsToggle.checked = showSeconds;

  function t(key){ return (L[lang]&&L[lang][key])?L[lang][key]:key; }
  function saveAll(){
    localStorage.setItem('nclock_hours',customHours);
    localStorage.setItem('nclock_mode',mode);
    localStorage.setItem('nclock_sw_elapsed',elapsedMs);
    localStorage.setItem('nclock_sw_laps',JSON.stringify(laps));
    localStorage.setItem('nclock_alarms',JSON.stringify(alarms));
    localStorage.setItem('nclock_show_seconds',showSeconds);
    localStorage.setItem('nclock_lang',lang);
    localStorage.setItem('nclock_last_triggered',lastTriggered);
  }

  function setMode(m){
    mode=m;
    [tabClock,tabStopwatch,tabAlarm,tabSettings].forEach(t=>t.classList.remove('active'));
    if(m==='clock')tabClock.classList.add('active');
    if(m==='stopwatch')tabStopwatch.classList.add('active');
    if(m==='alarm')tabAlarm.classList.add('active');
    if(m==='settings')tabSettings.classList.add('active');

    stopwatchArea.style.display=(m==='stopwatch')?'flex':'none';
    alarmArea.style.display=(m==='alarm')?'block':'none';
    settingsArea.style.display=(m==='settings')?'block':'none';
    slider.parentElement.style.display=(m==='clock')?'block':'none';
    saveAll();
  }
  setMode(mode);

  slider.addEventListener('input',e=>{
    customHours=Number(e.target.value);
    labelHours.textContent=lang==='en'?`${customHours} h`:`${customHours} 時間`;
    saveAll();
  });

  tabClock.addEventListener('click',()=>setMode('clock'));
  tabStopwatch.addEventListener('click',()=>setMode('stopwatch'));
  tabAlarm.addEventListener('click',()=>setMode('alarm'));
  tabSettings.addEventListener('click',()=>setMode('settings'));

  langSelect.addEventListener('change',()=>{ lang=langSelect.value; saveAll(); });

  secondsToggle.addEventListener('change',()=>{
    showSeconds=secondsToggle.checked;
    secondsLabel.textContent=showSeconds? (lang==='en'?'On':'表示'):(lang==='en'?'Off':'非表示');
    saveAll();
  });

  // Stopwatch
  let running=false;
  function formatStopwatch(ms){
    const total=Math.floor(ms/1000);
    const h=Math.floor(total/3600);
    const m=Math.floor(total/60)%60;
    const s=total%60;
    if(h>0)return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }

  function renderLaps(){
    lapList.innerHTML='';
    if(laps.length===0){
      lapList.innerHTML=`<div style="color:var(--muted);padding:8px">${t('noLaps')}</div>`;
      return;
    }
    laps.forEach((t,i)=>{
      const node=document.createElement('div');
      node.className='lap-item';
      node.innerHTML=`<div>Lap ${laps.length-i}</div><div>${t}</div>`;
      lapList.appendChild(node);
    });
  }
  renderLaps();

  swStart.addEventListener('click',()=>{
    running=!running;
    swStart.textContent=running?t('btn.stop'):t('btn.start');
    swLap.disabled=!running;
    swReset.disabled=running;
  });
  swLap.addEventListener('click',()=>{
    laps.unshift(formatStopwatch(elapsedMs));
    if(laps.length>5000)laps.pop();
    renderLaps();
    saveAll();
  });
  swReset.addEventListener('click',()=>{
    elapsedMs=0; laps=[]; renderLaps(); swReset.disabled=true; saveAll();
  });

  // Alarm
  function genId(){return Math.floor(Math.random()*1e9).toString(36);}
  function renderAlarms(){
    alarmsContainer.innerHTML='';
    if(alarms.length===0){alarmsContainer.innerHTML=`<div style="color:var(--muted);padding:8px">${t('noAlarms')}</div>`; return;}
    alarms.forEach((a,idx)=>{
      const card=document.createElement('div'); card.className='alarm-card';
      const timeDiv=document.createElement('div'); timeDiv.className='alarm-time';
      timeDiv.textContent=`${String(a.hour).padStart(2,'0')}:${String(a.min).padStart(2,'0')}`;
      const actions=document.createElement('div'); actions.className='alarm-actions';
      const toggle=document.createElement('div'); toggle.className='toggle'+(a.enabled?' on':'');
      const thumb=document.createElement('div'); thumb.className='thumb'; toggle.appendChild(thumb);
      toggle.addEventListener('click',()=>{a.enabled=!a.enabled; saveAll(); renderAlarms();});
      const del=document.createElement('button'); del.className='del-btn'; del.textContent=t('delete');
      del.addEventListener('click',()=>{alarms.splice(idx,1); saveAll(); renderAlarms();});
      actions.appendChild(toggle); actions.appendChild(del);
      card.appendChild(timeDiv); card.appendChild(actions);
      alarmsContainer.appendChild(card);
    });
  }
  renderAlarms();
  alarmSetBtn.addEventListener('click',()=>{
    const val=alarmTimeInput.value;
    if(!val){alert(t('msg.pickTime'));return;}
    const [hh,mm]=val.split(':').map(n=>Number(n));
    if(isNaN(hh)||isNaN(mm)){alert(t('msg.invalidTime'));return;}
    alarms.push({id:genId(),hour:hh,min:mm,enabled:true});
    saveAll(); renderAlarms(); alarmTimeInput.value='';
  });

  function playAlarmSound(){try{const ctx=new (window.AudioContext||window.webkitAudioContext)();const gain=ctx.createGain();gain.connect(ctx.destination);gain.gain.value=0.0001;let t0=ctx.currentTime;for(let i=0;i<6;i++){const o=ctx.createOscillator();o.type='sine';o.frequency.value=880-i*40;o.connect(gain);o.start(t0+i*0.5);o.stop(t0+i*0.5+0.35);}gain.gain.exponentialRampToValueAtTime(0.25,t0+0.02);gain.gain.exponentialRampToValueAtTime(0.0001,t0+3.2);setTimeout(()=>{try{ctx.close();}catch(e){}},4000);}catch(e){}}

  if('Notification' in window && Notification.permission==='default'){Notification.requestPermission().catch(()=>{});}

  let lastFrame=performance.now();
  function tick(now){
    let dt=now-lastFrame;if(!isFinite(dt)||dt<=0)dt=16; lastFrame=now;
    const speed=24/customHours;
    if(running)elapsedMs+=dt*speed;
    // Clock
    if(mode==='clock
           // Clock
    if(mode==='clock'){
      const nowDate=new Date();
      const h=nowDate.getHours();
      const m=nowDate.getMinutes();
      const s=nowDate.getSeconds();
      display.textContent=showSeconds
        ? `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
        : `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
    } else if(mode==='stopwatch'){
      display.textContent=formatStopwatch(elapsedMs);
    }

    // Alarm check
    if(mode==='clock'){
      const n=new Date();
      alarms.forEach(a=>{
        if(a.enabled){
          const curr=n.getHours()*60+n.getMinutes();
          const alarmTime=a.hour*60+a.min;
          if(curr===alarmTime && lastTriggered!==`${a.id}`){
            lastTriggered=a.id;
            playAlarmSound();
            if(Notification.permission==='granted'){
              new Notification(t('msg.alarmSound'));
            }
            saveAll();
          }
        }
      });
    }

    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
});
