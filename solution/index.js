
/**
 * this class orgenize the storage.
 * @var {object} tasks - an object that holds all the saved information
 * @var {storage} myStorage - holds the local storage.
 * 
 * @constructor constructor(bool)
 * 
 * @public functions:
 * @function syncDOM(value)
 * @function add(key,val)
 * @function getVals(key)
 * @function setVal(key,oldVal,newVal)
 * @function removeVal(key,value)
 * @function loadFromApi()
 * @function saveToApi()
 * 
 * @private functions;
 * @function #newWindow()
 * @function #createDOMelements(values,elToAppend)
 * 
 */
class myLocalStorage{
    tasks;
    myStorage;

    /**
     * @constructor
     * @param {boolean} bool 
     * generate the tasks object and the local storage by the api.
     * syncs the DOM accordingly.
     */
    constructor(bool){
        this.myStorage = window.localStorage;
        this.tasks = {
            "todo": [],
            "in-progress": [],
            "done": []
        };
        if(bool){
            this.saveToApi();
            // this.myStorage.clear();
            // this.myStorage.setItem('tasks', JSON.stringify(this.tasks));
        }
        this.syncDOM();
    }

    /**
     * the function loads information from api, and according to this info generates the DOM.
     * if value has been given- represents filtered info by the value.
     * @param {string} value - optional. filters the elements to show by the value.
     */
    async syncDOM(value){
        let elToAppend;

        await this.loadFromApi();
        
        this.#newWindow()

        console.log("syncDOM");
        console.log(this.tasks)
        
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
                    if(val.toLowerCase().includes(value.toLowerCase())) {
                        values.push(val)
                    }
                }
            }
            this.#createDOMelements(values, elToAppend);
        }
    }

    /**
     * cleans the sections.
     * @access private
     */
    #newWindow(){
        let ulElement;
        for(let key of Object.keys(this.tasks)){
            if(key ==="todo") key = "to-do"
            ulElement = document.getElementById("section-"+key).children[1]
            while(ulElement.firstChild) ulElement.removeChild(ulElement.firstChild)
        }
    }

    /**
     * The function creates and appends HTML elements.
     * @access private
     * @param {Array}       values     - array of the values to append.
     * @param {HTMLElement} elToAppend - element to append the values to.
     */
    #createDOMelements(values, elToAppend){
        for(const value of values){
            let textEl = document.createElement("p");
            textEl.textContent = value;
            let li = document.createElement("li");
            li.setAttribute("class", "task")
            li.appendChild(textEl);
            li.addEventListener("dblclick",() => dblClickHandler(li));

            li.addEventListener("mouseover", () =>document.onkeydown = pressOnHoverHandler)
            li.addEventListener("mouseout", () => document.onkeydown = null)

            elToAppend.appendChild(li)
        }
    }

    /**
     * the function gets a value to add to key. adds it to local storage, to tasks object and to the api.
     * @param {string} key - key to add to.
     * @param {string} val - the values to add.
     */
    async add(key, val){
        this.tasks[key].unshift(val);
        this.myStorage.setItem('tasks',JSON.stringify(this.tasks))
        let x;
        do{
            x = await this.saveToApi()
        }
        while(!x)
        this.syncDOM();
    }

    /**
     * gets the values of a specific key.
     * @param {string} key - key to get the values of.
     * @returns {Array}    - array of the values
     */
    getVals(key){
        return this.tasks[key];
    }

    /**
     * sets a new value instead of the old one in a specific key.
     * @param {string} key    - the key of the value we want to set.
     * @param {string} oldVal - the old value we want to change.
     * @param {string} newVal - the new value.
     */
    setVal(key,oldVal,newVal){
        let vals = this.getVals(key);
        let index = vals.indexOf(oldVal);
        if(index <= -1) return;
        vals[index] = newVal;
        this.myStorage.setItem('tasks',JSON.stringify(this.tasks))
        this.saveToApi();
    }

    /**
     * removes a value from key.
     * @param {string} key   - key to remove from
     * @param {string} value - the value to remove
     * @returns 
     */
    async removeVal(key,value){
        let vals = this.getVals(key);
        let index = vals.indexOf(value);
        if(index < 0) return;
        vals.splice(index,1);
        this.myStorage.setItem('tasks',JSON.stringify(this.tasks))
        await this.saveToApi();
        this.syncDOM();
    }

    /**
     * loads data from api and sets the tasks object and local storage by it.
     * @returns 1 if successfully got answer
     *          null otherwise.
     */
    async loadFromApi(){
        this.#createLoader();
        const getProp = {
            method : "GET",
            headers:{
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
        }
        const getAns = await fetch("https://json-bins.herokuapp.com/bin/614b9b97815b7dac76e143fa",getProp)
        if(getAns.ok){
            const newValues = await getAns.json();
            this.tasks = newValues.tasks;
            this.myStorage.setItem('tasks', JSON.stringify(this.tasks));
            this.#deleteLoader();
            return 1;
        }
        this.#deleteLoader();
        return null;
    }
    
    /**
     * saves the data in tasks object into the api.
     * @returns 1 if successfully got answer
     *          null otherwise.
     */
    async saveToApi(){
        this.#createLoader();
        let tasks = this.tasks
        const putProp = {
            method : "PUT",
            mode :"cors",
            headers:{
                "Accept": "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({tasks})
        }
        let putAns = await fetch("https://json-bins.herokuapp.com/bin/614b9b97815b7dac76e143fa",putProp)
        if(putAns.ok){
            this.#deleteLoader();
            return 1;
        }
        this.#deleteLoader();
        return null
    }

    #createLoader(){
        if(document.getElementById("loader"))  return;
        let body = document.getElementsByTagName('body')[0];
        
        let loaderDiv = document.createElement("div");
        loaderDiv.id = "loader";

        let p = document.createElement("p");
        p.textContent = "Loading...";

        let div = document.createElement("div");
        div.classList.add("loader");

        loaderDiv.appendChild(p);
        loaderDiv.appendChild(div);

        body.appendChild(loaderDiv)
    }

    #deleteLoader(){
        if(!document.getElementById("loader"))  return;
        body.removeChild(document.getElementById("loader"))
    }
}

let localStorage = new myLocalStorage();
document.getElementById("search").onkeyup = searchKeyDownHandler;


/**
 * listener of search input change.
 * searches by the value currently in search-input, and represents it only.
 */
function searchKeyDownHandler(){
    value = document.getElementById("search").value;
    localStorage.syncDOM(value);
}

/**
 * Removes an element to other section.
 * @param {HTMLElement} elToMove - the element we want to move.
 * @param {HTMLElement} to       - new location of the element.
 */
async function moveElement(elToMove, to){
    console.log("moveElement")
    console.log(elToMove)
    console.log(to)
    let father = elToMove.parentElement;
    const localStorageKeyFrom = father.parentElement.dataset.name;
    const localStorageKeyTo = to.parentElement.dataset.name;
    const localStorageValue = elToMove.firstChild.textContent;

    await localStorage.removeVal(localStorageKeyFrom, localStorageValue);
    await localStorage.add(localStorageKeyTo, localStorageValue);

}

/**
 * Event listener- when the mise gets on an element and pushes a key.
 * If alt+1/2/3 is pushed, moves the item according to the instructions.
 * @param {event} evt 
 */
function pressOnHoverHandler(evt){
    const TODO = '1', IN_PROGRESS = '2', DONE = '3'
    if(evt.altKey) {
        let elementToMove = document.querySelectorAll(":hover")[9];
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

/**
 * Listener to 'add' button push.
 * adds the value in the fit input to the rellevante parameters, and shows it on the DOM.
 * @param {Event} caller 
 */
function onClickHandler(caller){
    const father = caller.parentElement;
    const value = father.children[2].value;
    
    if(!value){
        alert("Can't add empty text")
        return;
    }

    const localStorageKey = father.dataset.name;
    localStorage.add(localStorageKey, value);

    father.children[2].value = "";

    localStorage.syncDOM();
}

/**
 * Event listener of double clicking on <li> element.
 * sets contentEditable to true, and sets a listener "blur".
 * once "blue" activated, the new value is seted.
 * @param {HTMLElement} liEl - <li> element
 */
function dblClickHandler(liEl){
    let textEl = liEl.firstChild
    const oldVal = textEl.textContent
    const localStorageKey = textEl.parentElement.parentElement.parentElement.dataset.name //the data of the section element 
    textEl.contentEditable = "true"
    textEl.focus();

    const blurFunc = () => {
        localStorage.setVal(localStorageKey,oldVal,textEl.textContent)
        textEl.contentEditable = "false"
        textEl.removeEventListener("blur",blurFunc)
    }

    textEl.addEventListener("blur",blurFunc)
}

