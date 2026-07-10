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
