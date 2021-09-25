/**
 * this class orgenize the storage.
 * vars - tasks - an object that holds all the saved information
 */
class myLocalStorage{
    tasks;
    myStorage;

    constructor(bool){
        this.tasks = {
            "todo": [],
            "in-progress": [],
            "done": []
        };
        this.myStorage = window.localStorage;
        if(bool){
            this.myStorage.clear();
        }
        if(this.myStorage.getItem('tasks')){//if there was local storage earlier
            this.tasks = JSON.parse(this.myStorage.getItem('tasks'));
            this.DOMSync();
        }
        else{
            this.myStorage.setItem('tasks',JSON.stringify(this.tasks));
        }
    }

    DOMSync(value){
        let elToAppend;
        this.#newWindow()
        
        for(const key in this.tasks){
            let elId = key;

            //private situation of todo section
            if(elId === "todo") elId = "to-do"
            elId = "section-"+elId;

            elToAppend = document.getElementById(elId).children[1]
            for(let child of elToAppend.children){
                elToAppend.removeChild(child)
            }
            let values = this.tasks[key]
            if(value != undefined){
                values = [];
                for(const val of this.tasks[key]){
                    if(val.includes(value)) {
                        values.push(val)
                    }
                }
            }

            this.#createDOMelements(values, elToAppend);
        }
    }

    #newWindow(){
        let ulElement;
        for(let key of Object.keys(this.tasks)){
            if(key ==="todo") key = "to-do"
            ulElement = document.getElementById("section-"+key).children[1]
            while(ulElement.firstChild) ulElement.removeChild(ulElement.firstChild)
        }
    }

    #createDOMelements(values, elToAppend){
        for(const value of values){
            let textEl = document.createElement("p");
            textEl.textContent = value;
            let li = document.createElement("li");
            li.appendChild(textEl);
            li.addEventListener("dblclick",() => dblClickHandler(li));

            li.addEventListener("mouseover", () =>document.onkeydown = pressOnHoverHandler)
            li.addEventListener("mouseout", () => document.onkeydown = null)

            elToAppend.appendChild(li)
        }
    }

    add(key, val){
        this.tasks[key].push(val);
        this.myStorage.setItem('tasks',JSON.stringify(this.tasks))
    }

    print(){
        console.log(this.tasks);
        console.log(this.myStorage);
    }

    getVals(key){
        return this.tasks[key];
    }

    setVal(key,oldVal,newVal){
        let vals = this.getVals(key);
        let index = vals.indexOf(oldVal);
        if(index <= -1) return;
        vals[index] = newVal;
        this.myStorage.setItem('tasks',JSON.stringify(this.tasks))
    }

    removeVal(key,value){
        let vals = this.getVals(key);
        let index = vals.indexOf(value);
        if(index < 0) return;
        vals.splice(index,1);
        this.myStorage.setItem('tasks',JSON.stringify(this.tasks))
    }

    findVals(str){
        let values = [];
        for(const key in this.tasks){

            for(const value of this.tasks[key]){
                if(value.toLowerCase().includes(str.toLowerCase())){
                    values.push(value)
                }
            }
        }

    }
}

let localStorage = new myLocalStorage();
//localStorage.print();

document.getElementById("search").onkeyup = searchKeyDownHandler;

function searchKeyDownHandler(evt){
    value = document.getElementById("search").value;
    localStorage.DOMSync(value);
}


function moveElement(elToMove, to){
    let father = elToMove.parentElement;
    father.removeChild(elToMove);
    to.appendChild(elToMove);

    const localStorageKeyFrom = father.parentElement.dataset.name;
    const localStorageKeyTo = to.parentElement.dataset.name;
    const localStorageValue = elToMove.firstChild.textContent
    localStorage.removeVal(localStorageKeyFrom, localStorageValue);
    localStorage.add(localStorageKeyTo, localStorageValue);
}

function pressOnHoverHandler(evt){
    const TODO = '1', IN_PROGRESS = '2', DONE = '3'
    if(evt.altKey) {
        let elementToMove = document.querySelectorAll(":hover")[5];
        const key = evt.key;
        const localStorageKey = document.querySelectorAll(":hover")[3].dataset.name
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
    let value = father.children[2].value;
    
    if(!value){
        alert("Can't add empty text")
        return;
    }

    const localStorageKey = father.dataset.name;
    localStorage.add(localStorageKey, value);

    localStorage.DOMSync();

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
        localStorage.setVal(localStorageKey,oldVal,textEl.textContent)
    })
}

