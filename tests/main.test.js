/**
 * @jest-environment node
 */
const puppeteer = require('puppeteer')
const full4s = require('./utils/utils')
const path = require('path')
const basePath = path.join(__dirname, '..')
const pagePath = path.join('file://', basePath, `/solution/index.html`)

let page
let browser

const submitAddToDoBtn = '#submit-add-to-do'
const submitInProgressBtn = '#submit-add-in-progress'
const submitDoneBtn = '#submit-add-done'

const addToDoInput = '#add-to-do-task'
const inProgressInput = '#add-in-progress-task'
const doneInput = '#add-done-task'

const searchInput = '#search'

const pageTitle = '#page-title'

const toDoTasksList = '.to-do-tasks'
const inProgressTasksList = '.in-progress-tasks'
const doneTasksList = '.done-tasks'

const mockTasksText = 'second task input'

const saveTasksToApiBtn = '#save-btn'
const loadTasksFromApiBtn = '#load-btn'

const loader = '.loader'

const lists = [toDoTasksList, inProgressTasksList, doneTasksList]
const inputs = [addToDoInput, inProgressInput, doneInput]
const submitBtns = [submitAddToDoBtn, submitInProgressBtn, submitDoneBtn]

const tasksTypes = ['todo', 'in-progress', 'done']

jest.setTimeout(60000)
const projectName = 'Pre App'

const sortObj = (obj) =>
  Object.entries(obj).reduce(
    (acc, [key, val]) => ({ ...acc, [key]: val.sort() }),
    {}
  )

const localStorage = async () =>
  await page.evaluate(() => Object.assign({}, window.localStorage))

const BASE_URL = 'https://json-bins.herokuapp.com'

const getTasksFromLocalStorage = async () => {
  const tasks = (await localStorage()).tasks
  return sortObj(JSON.parse(tasks))
}

const expectLoaderCount = async (c) => {
  const loaders = await page.$$(loader)
  expect(loaders.length).toBe(c)
}

const addTasksAndTest = async (startTingIndex = 0) =>
  await full4s.asyncForEach(lists, async (listItem, index) => {
    const task = `Tasks #${index + startTingIndex}`
    await page.type(inputs[index], task)
    await page.click(submitBtns[index])
    const selector = `${listItem} > .task`
    await page.waitForSelector(selector)
    const newTask = await page.$(selector)
    const newTaskText = await (
      await newTask.getProperty('innerText')
    ).jsonValue()
    expect(task).toBe(newTaskText)
  })

const countTasks = async () => {
  const tasks = await page.$$('.task')
  let count = 0
  await full4s.asyncForEach(tasks, async (task) => {
    const isVisible = !!(await task.boundingBox())
    if (isVisible) count += 1
  })
  return count
}
const getResponse = () => ({
  status: 200,
  contentType: '*',
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    'Content-Type': 'application/json',
    'Access-Control-Allow-Headers':
      'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  },
})

const emptyTasks = sortObj(
  tasksTypes.reduce((acc, curr) => ({ ...acc, [curr]: [] }), {})
)

const fullTasks = sortObj(
  tasksTypes.reduce(
    (acc, curr, index) => ({ ...acc, [curr]: [`Tasks #${index}`] }),
    {}
  )
)

let wasInPut = false

describe(projectName, () => {
  beforeAll(async () => {
    browser = await puppeteer.launch({ headless: false }) //change to false if you want to view the page
    page = await browser.newPage()
    page.setRequestInterception(true)
    page.on('request', async (req) => {
      if (!req.url().startsWith(BASE_URL)) return req.continue()
      await page.waitForTimeout(100) //for loader
      await expectLoaderCount(1)
      if (req.method() === 'GET') {
        req.respond({
          ...getResponse(),
          body: JSON.stringify({
            tasks: emptyTasks,
            name: 'test',
          }),
        })
      } else {
        req.respond({
          ...getResponse(),
          body: JSON.stringify({
            tasks: tasksTypes.reduce(
              (acc, curr, _, all) => ({ ...acc, [curr]: all }),
              { name: 'test' }
            ),
          }),
        })
        wasInPut = true
      }
    })
    await page.setViewport({ width: 1000, height: 600 })
    await page.goto(pagePath, { waitUntil: 'networkidle0' })
    await full4s.beforeAll()
  })

  afterEach(async () => {
    await full4s.afterEach(page)
  })

  afterAll(async () => {
    await browser.close()
  })

  test('Page title should be defined', async () => {
    const pageTitleEl = await page.$(pageTitle)
    expect(pageTitleEl).not.toBeNull()
  })

  test('The todo list should be empty first', async () => {
    const elements = await page.$$('.task')
    expect(elements.length).toBe(0)
  })

  test('Can add todo task with text to every section and save the data to local storage', async () => {
    await addTasksAndTest()
    const tasks = await page.$$('.task')
    expect(tasks.length).toBe(3)
    const localStorageData = await getTasksFromLocalStorage()
    expect(localStorageData).toEqual({ ...fullTasks })
    await page.reload()
    const tasksCountAfterRefresh = await countTasks()
    expect(tasksCountAfterRefresh).toBe(3)
  })

  test('User should be able to move tasks with alt + numbers and the new lists data should be saved to local storage', async () => {
    const tasks = await page.$$('.task')
    await tasks[0].click()
    await tasks[0].hover()
    await full4s.asyncForEach(lists, async (listItem) => {
      const childs = await page.$$(`${listItem} > .task`)
      expect(childs.length).toBe(1)
    })
    await page.keyboard.down('Alt')
    await page.keyboard.press('2')
    await page.keyboard.up('Alt')
    const expectedData = {}
    await full4s.asyncForEach(lists, async (listItem, i) => {
      const childs = await page.$$(`${listItem} > .task`)
      switch (i) {
        case 0:
          expectedData[tasksTypes[i]] = []
          expect(childs.length).toBe(0)
          break
        case 1:
          expectedData[tasksTypes[i]] = [...Array(2)].map(
            (_, i) => `Tasks #${i}`
          )
          expect(childs.length).toBe(2)
          break
        default:
          expectedData[tasksTypes[i]] = [`Tasks #2`]
          expect(childs.length).toBe(1)
      }
    })
    const localStorageData = await getTasksFromLocalStorage()
    expect(localStorageData).toEqual(expectedData)
  })

  test('User should be able to edit task with double click and the new task data will be saved in the local storage', async () => {
    const firstTask = await page.$('.task')
    const getTaskText = async () =>
      (await firstTask.getProperty('innerText')).jsonValue()
    const prevText = await getTaskText()
    const box = await firstTask.boundingBox()
    const x = box.x + box.width / 2
    const y = box.y + box.height / 2
    await page.mouse.click(x, y, { clickCount: 2 })
    await page.mouse.click(x, y, { clickCount: 3 })
    await page.keyboard.press('Backspace')
    await page.keyboard.type(mockTasksText)
    await page.$eval('.task', (e) => e.blur())
    const newText = await getTaskText()
    const localStorageData = await getTasksFromLocalStorage()
    expect(localStorageData[tasksTypes[1]]).toContain(newText)
    expect(newText).toBe(mockTasksText)
    expect(newText).not.toBe(prevText)
  })

  test('User should be able to search between tasks', async () => {
    const handleSearch = async (val) => {
      await page.$eval(searchInput, (el) => (el.value = ''))
      await page.type(searchInput, val)
    }
    const initialTasksCount = await countTasks()
    expect(initialTasksCount).toBe(3)
    await handleSearch('1')
    const secondCountTasks = await countTasks()
    expect(secondCountTasks).toBe(1)
    await handleSearch('t')
    expect(initialTasksCount).toBe(3)
    await page.$eval(searchInput, (e) => e.focus())
    await page.keyboard.press('Backspace')
    await page.$eval(searchInput, (e) => e.blur())
  })

  test('User should be able to save and load their tasks from the api and save it to the local storage', async () => {
    const initialTasksCount = await countTasks()
    expect(initialTasksCount).toBe(3)
    await page.click(loadTasksFromApiBtn)
    await page.waitForTimeout(300)
    await expectLoaderCount(0)
    const currTasksCount = await countTasks()
    expect(currTasksCount).toBe(0)
    const localStorageData = await getTasksFromLocalStorage()
    expect(localStorageData).toEqual(emptyTasks)
    await page.reload()
    const tasksCountAfterRefresh = await countTasks()
    expect(tasksCountAfterRefresh).toBe(0)
  })

  test('User should be save tasks from the api', async () => {
    await addTasksAndTest()
    const initialTasksCount = await countTasks()
    expect(initialTasksCount).toBe(3)
    await page.click(saveTasksToApiBtn)
    await page.waitForTimeout(300)
    await expectLoaderCount(0)
    expect(wasInPut).toBe(true)
  })
})
