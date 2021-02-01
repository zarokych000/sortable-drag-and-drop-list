'use strict';
const allColumns = document.querySelectorAll('ul');
const firstColumn = document.querySelector('#first-column');
const secondColumn = document.querySelector('#second-column');
const thirdColumn = document.querySelector('#third-column');
const fourthColumn = document.querySelector('#fourth-column');
const blueWrapper = document.querySelector('.box');
const wrapper = document.querySelector('.wrapper');
let draggedElement;
let topAndBottomCorner;
let counter;
let clone;
let changedElement;
let switcher;

// функция получения карточек с сервера
async function recieveData(url){
  let response = await fetch(url);
  if(response.ok){
    let json = await response.json();
    console.log(json);
    createCards(json);
  } else{
    alert('Ошибка');
  }
}

recieveData('http://localhost:3000/card');

// динамическое создание и пуш карточек на страницу
function createCards(database){
  for(let data of database){
    let li = document.createElement('li');
    li.setAttribute('draggable', 'true');
    li.setAttribute('link', data.link);
    li.classList.add('card');
    li.innerHTML = `
    <div class="card-wrapper" data-dragged-color="${data.backgroundColor}">
      <div class="image-window">
        <img draggable="false" class="icon" src="${data.img}" alt="">
      </div>
      <div class="card-text-wrapper">
        <div class="quotes">
          "${data.quote}"
        </div>
        <div class="name-id">
          <div class="name ${data.color}">${data.name}</div>
          <div class="id">id:${data.id}</div>
        </div>
      </div>
    </div>
    `;
    if(data.column == 1){
      firstColumn.appendChild(li);
    } else if (data.column == 2){
      secondColumn.appendChild(li);
    } else if(data.column == 3){
      thirdColumn.appendChild(li);
    } else {
      fourthColumn.appendChild(li);
    }
  }
}

// начало drag операции
document.addEventListener('dragstart', (e) =>{
  draggedElement = e.target.closest('li');
  if(draggedElement){
    counter = 1;
    // shadow image
    clone = e.target.cloneNode(true);
    clone.style.backgroundColor = `${clone.firstElementChild.dataset.draggedColor}`;
    clone.classList.add('clone');

    document.body.append(clone);
    topAndBottomCorner = recordCoordCursor(e, e.target);

    e.dataTransfer.setDragImage(clone, topAndBottomCorner[2], topAndBottomCorner[0]);

    let data = draggedElement.outerHTML;
    if(draggedElement && draggedElement.classList.contains('card')){
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', data);
      e.target.style.opacity = 0.5;
    }
  }
});

// добавляет дроп зоне над которой находится карточка красный цвет
document.addEventListener('dragover', (e) =>{
  if(e.target.closest('ul') || e.target.closest('li')){
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    let dropZone = e.target.closest('ul');
    dropZone.classList.add("above-target");
    addOrRemoveHeight(e.target);
    paintParentColumn(e.target);
    counter--;
  } else{
    for(let column of allColumns){
      paintParentColumn(e.target);
      column.classList.remove("above-target");
      counter = 1;
    }
  }
});

// окрашивает покинутую родительскую колонку
function paintParentColumn(eventTarget){
  let dropZone = eventTarget.closest("ul");
  let draggedParent = draggedElement.parentElement;

  if(dropZone != draggedParent){
    draggedParent.classList.add('leaved-parent');
  } else {
    draggedParent.classList.remove('leaved-parent');
    clone.remove();
  }
}

// сам дроп
document.addEventListener('drop', (e) =>{
    if(e.target.closest('ul') != draggedElement.parentElement){
      removeHeightOfParent(draggedElement.parentElement);
      changedElement = false;
    }
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    let data = e.dataTransfer.getData('text/html');
    if(e.target.closest('ul').children.length != 1){
      let after;
      let radel = radar(e.clientX, e.clientY, e, e.target);
      if(!radel[0]){
        after = horizontalRadar(e.clientX, e.clientY);
        if(after[1]){
          after[0].insertAdjacentHTML('afterEnd', data);
        } else {
          after[0].insertAdjacentHTML('beforebegin', data);
        }
      } else {
        if(radel[1]){
          radel[0].insertAdjacentHTML('afterEnd', data);
        } else {
          radel[0].insertAdjacentHTML('beforebegin', data);
        }
      }
    } else {
      e.target.closest('ul').insertAdjacentHTML('beforeend', data);
    }
    draggedElement.remove();
    clone.remove();
    for(let column of allColumns){
      column.classList.remove('leaved-parent');
      column.classList.remove('above-target');
    }
});

// функция для горизонтального поиска, которая также определяет куда вставлять карточку перед или после другой карточки
// осложненна для поиска карточки в том случае если пользователь пытается вставить карточку на верхние/нижние
// поля и заголовок 
function horizontalRadar(x, y){
  let element;
  let parentElement = document.elementFromPoint(x, y);
  console.log(parentElement);
  let cor;
  let errorCount = [];
  for(let i = 2; i < 200; i += 5){
    try{
      element = document.elementFromPoint((x - i), y);
      if(!element.closest('.card') || element.closest('.card').parentElement != parentElement){ 
        element = document.elementFromPoint((x + i), y);
        if(element.closest('.card') && element.closest('.card').parentElement == parentElement){
          cor = element.getBoundingClientRect();
          break;
        } else {
          throw new Error('ошибка');
        }
      } else {
        cor = element.getBoundingClientRect();
        break;
      }
    } catch(err){
      if(errorCount.length > 3){
        element = document.elementFromPoint((x + i), y + i);
        if(element.closest('.card') && element.closest('.card').parentElement == parentElement){
          cor = element.getBoundingClientRect();
          break;
        } else {
          element = document.elementFromPoint((x + i), ((y - i) > 10 ? (y - i): y));
          if(element.closest('.card') && element.closest('.card').parentElement == parentElement){
            cor = element.getBoundingClientRect();
            break;
          } else {
            element = document.elementFromPoint(((x - i) > 5 ? (x - i): x),((y - i) > 1 ? (y - i): y));
            if(element.closest('.card') && element.closest('.card').parentElement == parentElement){
              cor = element.getBoundingClientRect();
              break;
            } else {
              element = document.elementFromPoint(((x - i) > 5 ? (x - i): x), y + i);
              if(element.closest('.card') && element.closest('.card').parentElement == parentElement){
                cor = element.getBoundingClientRect();
                break;
              } else {
                continue;
              }
            }
          }
        }
      } else {
        errorCount.push('error');
        continue;
      }
    }
  }
  if(element.closest('.card').parentElement == parentElement){
    let beforeOrAfter = (cor.height / 2) > (cor.bottom - y);
    console.log(beforeOrAfter);
    return[
      element.closest('.card'),
      beforeOrAfter,
    ];
  }
}

// функция для поиска карточек по вертикали, которая также определяет куда вставлять карточку перед или
// после другой карточки. Осложненна для случаев когда пользователь пытается вставить карточку на боковые поля
// или на боковые поля начала и конца списка 
function radar(x, y, event, element, numb = 0){
  let cardWrapper;
  let indic;
  for(let i = 20; i <= 300; i += 20){
    try{
      let comparison = recordCoordCursor(event, element, true);
      if(comparison[3].tagName == 'UL'){
        if(comparison[0] < comparison[1]){
          i += 55;
          cardWrapper = document.elementFromPoint(x, y + i - numb);
          cardWrapper.closest('.card');
          indic = false;
          break;
        } else {
          i += 100;
          cardWrapper = document.elementFromPoint(x, y - i - numb);
          indic = true;
          cardWrapper.closest('.card');
          break;
        }
      } else if(comparison[3].className == 'title'){
        i += 55;
        cardWrapper = document.elementFromPoint(x, y + i);
        cardWrapper.closest('.card');
        indic = false;
        break;
      } 
      else {
        if(comparison[0] > comparison[1]){
          cardWrapper = document.elementFromPoint(x, y - i);
          cardWrapper.closest('.card');
          indic = true;
          break;
        } else {
          cardWrapper = document.elementFromPoint(x, y + i);
          indic = false;
          break;
        }
      }
    } catch(err){
      continue;
    }
  }
  return[cardWrapper.closest('.card'), indic];
}

// удаляет все добавленные стили при завершении переноса
document.addEventListener('dragend', (e) => {
  for(let column of allColumns){
    column.classList.remove('leaved-parent');
    column.classList.remove('above-target');
  }
  draggedElement.style.opacity = '';
  if(changedElement){
    changed(changedElement);
  }

});


// при клике по карточке переносит на страницу персонажа
document.addEventListener('click', (e) =>{
  let element = e.target.closest('li');
  if(element && element.classList.contains('card')){
    let link = element.getAttribute('link');
    location.href = link;
  }
});


// записывает координаты курсора относитльно карточки(за какую часть карточки пользователь её взял)
function recordCoordCursor(event, element, radar){
  let coords;
  let elem;
  let offsetFromTop;
  let offsetFromBottom;

  function supporteRecordCursor(){
    elem = document.elementFromPoint(event.clientX, event.clientY);
    offsetFromTop = event.clientY - coords.top;
    offsetFromBottom = coords.bottom - event.clientY;
  }

  if(!radar){
    coords = element.getBoundingClientRect();
    supporteRecordCursor();
  } else {
    elem = document.elementFromPoint(event.clientX, event.clientY);
    if(!elem.closest('.card')){
      coords = element.getBoundingClientRect();
      supporteRecordCursor();
    } else {
      coords = element.closest('.card').getBoundingClientRect();
      supporteRecordCursor();

    }
  }

  return [
    offsetFromTop,
    offsetFromBottom,
    event.clientX - coords.left,
    elem
  ];
}


// прибавляет или удаляет высоту карточки при переносе 
function addOrRemoveHeight(eventTarget){
  if(eventTarget.closest('ul') != draggedElement.parentElement && counter > 0){
    if(switcher){
      changed(changedElement);
    }
    changedElement = eventTarget.closest('ul');
    let ownHeight = changedElement.offsetHeight;
    let draggedElemHeight = draggedElement.offsetHeight;
    changedElement.style.height = `${+ownHeight + (+draggedElemHeight)}px`;
    switcher = true;
  } else if(eventTarget.closest('ul') == draggedElement.parentElement && counter > 0){
    changed(changedElement);
  }
}
// функция которая убирает повторяющийся код сверху
function changed(changedElement){
  if(changedElement && switcher){
    changedElement.style.height = `${+changedElement.offsetHeight - (+draggedElement.offsetHeight + 20)}px`;
    changedElement = false;
    switcher = false;
  }
}

// удалить высоту взятой карточки у родительской колонки
function removeHeightOfParent(element){
  element.style.height = `${+element.offsetHeight - +draggedElement.offsetHeight - 20}px`;
}



