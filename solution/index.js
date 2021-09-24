class myLocalStorage{
    static myStorage = window.localStorage;

    static add(key, val){
        let localStorageValue = this.myStorage.getItem(key);
        if(!localStorageValue){
            this.myStorage.setItem(key, val)
        }
        else{
            this.myStorage.setItem(key, localStorageValue + "," + val);
        }
    }
    
    static getVals(key){
        if(this.myStorage.getItem(key))
            return this.myStorage.getItem(key).split(',');
        return;
    }

    static setVal(key,oldVal,newVal){
        let vals = this.getVals(key);
        let index = vals.indexOf(oldVal);
        if(index <= -1){
            return;
        }
        vals[index] = newVal;
        this.myStorage.setItem(key, vals.join(','))
    }

    static removeVal(key, value){
        let vals = this.getVals(key);
        let index = vals.indexOf(value);
        console.log(index)
        if(index < 0){
            return;
        }
        vals.splice(index,1);
        this.myStorage.setItem(key, vals.join(','))
        return(value);
    }
}

function moveElement(elToMove, to){
    let father = elToMove.parentElement;
    father.removeChild(elToMove);
    to.appendChild(elToMove);
    console.log(myLocalStorage.myStorage)

    const localStorageKeyFrom = father.parentElement.dataset.name;
    const localStorageKeyTo = to.parentElement.dataset.name;
    const localStorageValue = elToMove.firstChild.textContent
    myLocalStorage.removeVal(localStorageKeyFrom, localStorageValue);
    myLocalStorage.add(localStorageKeyTo, localStorageValue);
}

function pressOnHoverHandler(evt){
    const TODO = '1', IN_PROGRESS = '2', DONE = '3'
    if(evt.altKey) {
        let elementToMove = document.querySelectorAll(":hover")[5];
        const key = evt.key;
        const localStorageKey = document.querySelectorAll(":hover")[3].dataset.name
        //console.log(localStorageKey)
        if(key === TODO && localStorageKey != "to-do"){
            moveElement(elementToMove, document.getElementById("section-to-do").children[1])
        }
        else if(key === IN_PROGRESS && localStorageKey != "in-progress"){
            moveElement(elementToMove, document.getElementById("section-in-progress").children[1])
        }
        else if(key === DONE && localStorageKey != "done"){
            moveElement(elementToMove, document.getElementById("section-done").children[1])
        }
    }
}


function onClickHandler(caller){
    const father = caller.parentElement;
    let elToAppend = father.children[1];
    let value = father.children[2].value;
    

    if(!value){
        alert("Can't add empty text")
        return;
    }

    const localStorageKey = father.dataset.name;
    myLocalStorage.add(localStorageKey, value);

    var textEl;
    textEl = document.createElement("p");
    textEl.textContent = value;
    let li = document.createElement("li");
    li.appendChild(textEl);
    
    li.addEventListener("dblclick",() => dblClickHandler(li));

    li.addEventListener("mouseover", () =>document.onkeydown = pressOnHoverHandler)
    li.addEventListener("mouseout", () => document.onkeydown = null)

    elToAppend.appendChild(li)
    father.children[2].value = "";
}

function dblClickHandler(liEl){
    let textEl = liEl.firstChild
    const oldVal = textEl.textContent
    const localStorageKey = textEl.parentElement.parentElement.parentElement.dataset.name
    //the data of the section element 
    textEl.contentEditable = "true"
    textEl.focus();

    textEl.addEventListener("blur",() => {
        textEl.contentEditable = "false"
        myLocalStorage.setVal(localStorageKey,oldVal,textEl.textContent)
        console.log(myLocalStorage.myStorage)
    })
}

myLocalStorage.myStorage.clear();
