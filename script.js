document.querySelectorAll('[data-copy]').forEach(button=>{button.addEventListener('click',async()=>{const t=button.textContent;try{await navigator.clipboard.writeText(button.dataset.copy);button.textContent='✓ Password Copied';button.disabled=true;setTimeout(()=>{button.textContent=t;button.disabled=false},2000)}catch(e){button.textContent='Copy Failed';setTimeout(()=>{button.textContent=t},2000)}})});const s=document.querySelector('[data-search]');if(s){s.addEventListener('input',()=>{const q=s.value.toLowerCase().trim();document.querySelectorAll('[data-keywords]').forEach(c=>{c.style.display=c.dataset.keywords.toLowerCase().includes(q)?'':'none'})})}

async function loadPuertoVallartaWeather(){
  const temp = document.getElementById('weather-temp');
  if(!temp) return;

  const humidity = document.getElementById('weather-humidity');
  const wind = document.getElementById('weather-wind');
  const updated = document.getElementById('weather-updated');

  try{
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=20.6534&longitude=-105.2253&current=temperature_2m,relative_humidity_2m,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America%2FMexico_City';
    const response = await fetch(url, { cache: 'no-store' });
    const data = await response.json();
    const current = data.current;

    temp.textContent = Math.round(current.temperature_2m) + '°F';
    humidity.textContent = current.relative_humidity_2m + '%';
    wind.textContent = Math.round(current.wind_speed_10m) + ' mph';

    const now = new Date();
    updated.textContent = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }catch(error){
    temp.textContent = 'Unavailable';
    humidity.textContent = '--';
    wind.textContent = '--';
    updated.textContent = '--';
  }
}

loadPuertoVallartaWeather();
setInterval(loadPuertoVallartaWeather, 900000);


/* V6 reservation and cleaning test workflow */
(() => {
  if (!document.getElementById('openTester')) return;
  const DAY = 86400000;
  const $ = s => document.querySelector(s);
  const fmt = d => new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric'}).format(d);
  const iso = d => {
    const x = new Date(d.getTime() - d.getTimezoneOffset()*60000);
    return x.toISOString().slice(0,10);
  };
  const addDays = (d,n) => new Date(d.getTime()+n*DAY);

  let state = {
    checkin: new Date(),
    checkout: addDays(new Date(),30),
    compUsed: false
  };

  function nights() {
    return Math.round((state.checkout-state.checkin)/DAY);
  }

  function eligibility() {
    // Current live portal promise: 14 nights or longer.
    return nights() >= 14;
  }

  function renderStay() {
    const n = nights();
    $('#checkinDisplay').textContent = fmt(state.checkin);
    $('#checkoutDisplay').textContent = fmt(state.checkout);
    $('#nightsDisplay').textContent = `${n} night${n===1?'':'s'}`;
    $('#stayHeadline').textContent = `${n}-Night Test Reservation`;

    const hasComp = eligibility() && !state.compUsed;
    $('#includedBadge').hidden = !hasComp;
    $('#entitlementText').textContent = eligibility()
      ? 'This stay qualifies for one complimentary mid-stay cleaning. Additional cleanings are available for $100 USD each.'
      : 'This stay does not include a complimentary cleaning. Additional in-stay cleaning is available for $100 USD per service.';

    $('#cleaningIntro').textContent = eligibility()
      ? 'Your stay includes one complimentary cleaning. You can schedule it below, and add additional cleaning visits for $100 USD each.'
      : 'Enjoy your vacation while we take care of the reset. Additional in-stay cleaning is available for $100 USD per service.';

    const type = $('#cleaningType');
    type.innerHTML = '';
    if (hasComp) {
      const free = document.createElement('option');
      free.value='complimentary'; free.textContent='Complimentary mid-stay cleaning — $0';
      type.appendChild(free);
    }
    const paid = document.createElement('option');
    paid.value='paid'; paid.textContent='Additional cleaning — $100 USD';
    type.appendChild(paid);

    const min = addDays(state.checkin,1);
    const tomorrow = addDays(new Date(),1);
    const effectiveMin = min > tomorrow ? min : tomorrow;
    const max = addDays(state.checkout,-1);
    $('#cleaningDate').min = iso(effectiveMin);
    $('#cleaningDate').max = iso(max);
    $('#cleaningDate').value = effectiveMin <= max ? iso(effectiveMin) : '';
    updatePrice();
  }

  function updatePrice(){
    const free = $('#cleaningType').value === 'complimentary';
    $('#priceDisplay').textContent = free ? '$0' : '$100 USD';
    $('#reserveCleaning').textContent = free ? 'Schedule Complimentary Cleaning' : 'Reserve Cleaning · $100';
  }

  function setStay(n){
    const start = new Date();
    start.setHours(12,0,0,0);
    state.checkin = start;
    state.checkout = addDays(start,n);
    state.compUsed = false;
    renderStay();
    $('#confirmation').hidden = true;
    $('#testerDialog').close();
    location.hash = '#stayAware';
  }

  $('#openTester').addEventListener('click',()=>$('#testerDialog').showModal());
  document.querySelectorAll('[data-nights]').forEach(b=>b.addEventListener('click',()=>setStay(Number(b.dataset.nights))));
  $('#cleaningType').addEventListener('change',updatePrice);

  $('#applyCustom').addEventListener('click',()=>{
    const a = $('#customCheckin').value;
    const b = $('#customCheckout').value;
    if(!a || !b) return alert('Select both check-in and check-out dates.');
    const ci = new Date(a+'T12:00:00');
    const co = new Date(b+'T12:00:00');
    if(co <= ci) return alert('Check-out must be after check-in.');
    state.checkin=ci; state.checkout=co; state.compUsed=false;
    renderStay(); $('#confirmation').hidden=true; $('#testerDialog').close(); location.hash='#stayAware';
  });

  $('#reserveCleaning').addEventListener('click',()=>{
    const date = $('#cleaningDate').value;
    if(!date) return alert('Choose a cleaning date.');
    const free = $('#cleaningType').value === 'complimentary';
    const selected = new Date(date+'T12:00:00');
    const minAllowed = addDays(new Date(),1);
    if(selected < minAllowed) return alert('Please provide at least 24 hours notice.');
    if(free) state.compUsed = true;

    const status = free ? 'Complimentary' : 'TEST Stripe payment approved · $100 USD';
    $('#confirmationSummary').textContent =
      `${status}. Cleaning requested for ${fmt(selected)} during the ${$('#timeWindow').value.toLowerCase()} window. No payment or message was actually sent in test mode.`;

    $('#confirmation').hidden=false;
    renderStay();
    location.hash='#confirmation';

    const events = JSON.parse(localStorage.getItem('camfranV6TestEvents') || '[]');
    events.push({type:'cleaning_request_test',date:new Date().toISOString(),nights:nights(),cleaningDate:date,window:$('#timeWindow').value,complimentary:free});
    localStorage.setItem('camfranV6TestEvents', JSON.stringify(events.slice(-50)));
  });

  $('#resetBooking').addEventListener('click',()=>{
    state.compUsed=false; $('#confirmation').hidden=true; renderStay(); location.hash='#cleaning';
  });

  document.querySelector('.copy').addEventListener('click',e=>{
    e.currentTarget.textContent='Copied';
    setTimeout(()=>e.currentTarget.textContent='Copy Password',1200);
  });

  $('#customCheckin').value = iso(new Date());
  $('#customCheckout').value = iso(addDays(new Date(),30));
  renderStay();
})();