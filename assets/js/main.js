const slides = Array.from(document.querySelectorAll('.hero-slide'));
const dots = Array.from(document.querySelectorAll('.slide-dots button'));
let activeIndex = 0;
function showSlide(index){
  slides.forEach((slide,i)=>slide.classList.toggle('active', i===index));
  dots.forEach((dot,i)=>dot.classList.toggle('active', i===index));
  activeIndex=index;
}
dots.forEach(dot=>dot.addEventListener('click', ()=>showSlide(Number(dot.dataset.index))));
setInterval(()=>showSlide((activeIndex+1)%slides.length), 5000);

const modal = document.getElementById('videoModal');
const trailer = document.getElementById('projectTrailer');
const modalTitle = document.getElementById('videoModalTitle');

function openTrailer(button){
  if(button.classList.contains('pending-video')) return;
  trailer.src = button.dataset.video;
  trailer.poster = button.dataset.poster || '';
  modalTitle.textContent = button.dataset.title || 'Project trailer';
  modal.classList.add('open');
  modal.setAttribute('aria-hidden','false');
  document.body.classList.add('modal-open');
  trailer.load();
}
function closeTrailer(){
  trailer.pause();
  trailer.removeAttribute('src');
  trailer.load();
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden','true');
  document.body.classList.remove('modal-open');
}
document.querySelectorAll('.trailer-button').forEach(button=>button.addEventListener('click',()=>openTrailer(button)));
document.querySelectorAll('[data-close-video]').forEach(button=>button.addEventListener('click',closeTrailer));
document.addEventListener('keydown',event=>{if(event.key==='Escape' && modal.classList.contains('open')) closeTrailer();});


// Automatically activates the Car Crash trailer button when the expected file exists.
document.querySelectorAll('.pending-video').forEach(async button => {
  try {
    const response = await fetch(button.dataset.video, { method: 'HEAD' });
    if (response.ok) {
      button.classList.remove('pending-video');
      button.textContent = 'Watch trailer';
    }
  } catch (error) {
    // The button stays marked as pending until the file is uploaded.
  }
});
