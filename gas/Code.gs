/**
 * Todo List API - Google Apps Script Backend
 *
 * 使用说明：
 * 1. 将此代码贴到 Google Apps Script 编辑器
 * 2. 将下方的 SHEET_ID 替换为你的 Google Sheet ID
 * 3. 部署为 Web App（任何人可访问）
 */

// ============ 配置 ============
const SHEET_ID = '1KocYpvYiF0mHkC5r6EB9QkVQhF-o1i0eZnBtntffmVg'; // Todo Database
const SHEET_NAME = 'Sheet1'; // 工作表名称

// ============ 主要处理函数 ============

/**
 * 处理 GET 请求 - 获取所有 todos
 */
function doGet(e) {
  try {
    const todos = getAllTodos();
    return createJsonResponse({ success: true, data: todos });
  } catch (error) {
    return createJsonResponse({ success: false, error: error.message });
  }
}

/**
 * 处理 POST 请求 - 添加/更新/删除 todo
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    let result;

    switch (action) {
      case 'add':
        result = addTodo(data.title, data.description, data.dueDate, data.priority);
        break;
      case 'update':
        result = updateTodo(data.id, data.completed, data.title, data.description, data.dueDate, data.priority);
        break;
      case 'delete':
        result = deleteTodo(data.id);
        break;
      default:
        throw new Error('Invalid action: ' + action);
    }

    return createJsonResponse({ success: true, data: result });
  } catch (error) {
    return createJsonResponse({ success: false, error: error.message });
  }
}

// ============ CRUD 操作 ============

/**
 * 获取所有 todos
 */
function getAllTodos() {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();

  // 跳过标题行
  const todos = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0]) { // 确保有 ID
      todos.push({
        id: row[0],
        title: row[1],
        completed: row[2] === true || row[2] === 'TRUE',
        createdAt: row[3],
        description: row[4] || '',
        dueDate: row[5] || '',
        priority: row[6] || ''
      });
    }
  }

  return todos;
}

/**
 * 添加新 todo
 */
function addTodo(title, description, dueDate, priority) {
  const sheet = getSheet();
  const id = generateId();
  const createdAt = new Date().toISOString();
  const desc = description || '';
  const due = dueDate || '';
  const prio = priority || '';

  sheet.appendRow([id, title, false, createdAt, desc, due, prio]);

  return {
    id: id,
    title: title,
    completed: false,
    createdAt: createdAt,
    description: desc,
    dueDate: due,
    priority: prio
  };
}

/**
 * 更新 todo（支持修改完成状态、标题、描述、截止日期和优先级）
 */
function updateTodo(id, completed, title, description, dueDate, priority) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      let newTitle = data[i][1];
      let newCompleted = data[i][2] === true || data[i][2] === 'TRUE';
      let newDescription = data[i][4] || '';
      let newDueDate = data[i][5] || '';
      let newPriority = data[i][6] || '';

      // 更新标题（如果提供）
      if (title !== undefined && title !== null) {
        sheet.getRange(i + 1, 2).setValue(title);
        newTitle = title;
      }

      // 更新完成状态（如果提供）
      if (completed !== undefined && completed !== null) {
        sheet.getRange(i + 1, 3).setValue(completed);
        newCompleted = completed;
      }

      // 更新描述（如果提供）
      if (description !== undefined && description !== null) {
        sheet.getRange(i + 1, 5).setValue(description);
        newDescription = description;
      }

      // 更新截止日期（如果提供）
      if (dueDate !== undefined && dueDate !== null) {
        sheet.getRange(i + 1, 6).setValue(dueDate);
        newDueDate = dueDate;
      }

      // 更新优先级（如果提供）
      if (priority !== undefined && priority !== null) {
        sheet.getRange(i + 1, 7).setValue(priority);
        newPriority = priority;
      }

      return {
        id: id,
        title: newTitle,
        completed: newCompleted,
        createdAt: data[i][3],
        description: newDescription,
        dueDate: newDueDate,
        priority: newPriority
      };
    }
  }

  throw new Error('Todo not found: ' + id);
}

/**
 * 删除 todo
 */
function deleteTodo(id) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.deleteRow(i + 1);
      return { id: id, deleted: true };
    }
  }

  throw new Error('Todo not found: ' + id);
}

// ============ 辅助函数 ============

/**
 * 获取工作表
 */
function getSheet() {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  return spreadsheet.getSheetByName(SHEET_NAME);
}

/**
 * 生成唯一 ID
 */
function generateId() {
  return Utilities.getUuid();
}

/**
 * 创建 JSON 响应（支持 CORS）
 */
function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============ 初始化函数（可选）============

/**
 * 初始化工作表标题行
 * 首次使用时手动运行此函数
 * 如果表头缺少新字段，会自动补全
 */
function initializeSheet() {
  const sheet = getSheet();
  const expectedHeaders = ['id', 'title', 'completed', 'createdAt', 'description', 'dueDate', 'priority'];

  // 检查是否已有数据
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(expectedHeaders);
    Logger.log('Sheet initialized with headers');
    return;
  }

  // 获取当前表头
  const currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  // 检查并补全缺失的表头
  let updated = false;
  for (let i = 0; i < expectedHeaders.length; i++) {
    if (i >= currentHeaders.length || currentHeaders[i] !== expectedHeaders[i]) {
      sheet.getRange(1, i + 1).setValue(expectedHeaders[i]);
      updated = true;
    }
  }

  if (updated) {
    Logger.log('Sheet headers updated: ' + expectedHeaders.join(', '));
  } else {
    Logger.log('Sheet headers are up to date');
  }
}
