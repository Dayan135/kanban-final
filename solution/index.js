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
        if(!index){
            return;
        }
        vals[index] = newVal;
        this.myStorage.setItem(key, vals.join(','))
    }

    static removeVal(key, value){
        let vals = this.getVals(key);
        let index = vals.indexOf(oldVal);
        if(!index){
            return;
        }
        vals.splice(index,1);
    }
}

myLocalStorage.myStorage.clear();
myLocalStorage.add('hi','hello')
myLocalStorage.add('hi','hello2')
myLocalStorage.add('hi','hello1')
//console.log(getLocalStorageValues('hi'))
// console.log(myLocalStorage.getVals('hi'))
myLocalStorage.setVal('hi','hello2', 'hellllllllll')
console.log(myLocalStorage.myStorage);
myLocalStorage.removeVal('hi',"hellllllllll");


function onClickHandler(caller){
    const father = caller.parentElement;
    let elToAppend = father.children[1];
    let input = father.children[2];

    if(!input.value){
        alert("Can't add empty text")
        return;
    }

    const localStorageKey = father.dataset.name;
    

    var textEl;
    textEl = document.createElement("p");
    textEl.textContent = input.value;
    let li = document.createElement("li");
    li.appendChild(textEl);
    li.addEventListener("dblclick",() => dblClickHandler(li));

    elToAppend.appendChild(li)
    input.value = "";
}

function dblClickHandler(liEl){
    let textEl = liEl.firstChild
    textEl.contentEditable = "true"
    textEl.focus();

    textEl.addEventListener("blur",() => textEl.contentEditable = "false")
}

let myStorage = window.localStorage;
myStorage.clear();