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
const ATTACHMENT_FOLDER_NAME = 'TodoAttachments'; // Google Drive 附件文件夹名称
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB 文件大小限制
const ALLOWED_MIME_TYPES = [
  'image/png', 'image/jpeg', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain', 'text/csv', 'text/markdown'
];

// ============ 主要处理函数 ============

/**
 * 处理 GET 请求 - 获取所有 todos
 */
function doGet(e) {
  try {
    const userId = e.parameter.userId || '';
    const todos = getAllTodos(userId);
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
    const userId = data.userId || '';

    let result;

    switch (action) {
      case 'add':
        result = addTodo(data.title, data.description, data.dueDate, data.priority, data.tags, userId);
        break;
      case 'update':
        result = updateTodo(data.id, data.completed, data.title, data.description, data.dueDate, data.priority, data.tags);
        break;
      case 'delete':
        result = deleteTodo(data.id);
        break;
      case 'restore':
        result = restoreTodo(data.id);
        break;
      case 'getDeleted':
        result = getDeletedTodos(userId);
        break;
      case 'emptyTrash':
        result = emptyTrash(userId);
        break;
      case 'uploadAttachment':
        result = uploadAttachment(data.todoId, data.fileName, data.mimeType, data.fileData);
        break;
      case 'deleteAttachment':
        result = deleteAttachment(data.todoId, data.attachmentId);
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
 * 获取所有 todos（排除已软删除的记录，按 userId 过滤）
 */
function getAllTodos(userId) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();

  // 跳过标题行，过滤已删除的记录
  const todos = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const isDeleted = row[7] === true || row[7] === 'TRUE';
    const rowUserId = row[9] || '';

    // 按 userId 过滤（如果提供了 userId）
    if (userId && rowUserId !== userId) {
      continue;
    }

    if (row[0] && !isDeleted) { // 确保有 ID 且未删除
      // 解析 tags JSON 字符串
      let tags = [];
      if (row[8]) {
        try {
          tags = JSON.parse(row[8]);
        } catch (e) {
          tags = [];
        }
      }
      // 解析 attachments JSON 字符串
      let attachments = [];
      if (row[10]) {
        try {
          attachments = JSON.parse(row[10]);
        } catch (e) {
          attachments = [];
        }
      }
      todos.push({
        id: row[0],
        title: row[1],
        completed: row[2] === true || row[2] === 'TRUE',
        createdAt: row[3],
        description: row[4] || '',
        dueDate: row[5] || '',
        priority: row[6] || '',
        tags: tags,
        userId: rowUserId,
        attachments: attachments
      });
    }
  }

  return todos;
}

/**
 * 添加新 todo
 */
function addTodo(title, description, dueDate, priority, tags, userId) {
  const sheet = getSheet();
  const id = generateId();
  const createdAt = new Date().toISOString();
  const desc = description || '';
  const due = dueDate || '';
  const prio = priority || '';
  const tagsArray = tags || [];
  const tagsJson = tagsArray.length > 0 ? JSON.stringify(tagsArray) : '';
  const uid = userId || '';

  sheet.appendRow([id, title, false, createdAt, desc, due, prio, false, tagsJson, uid, '']);

  return {
    id: id,
    title: title,
    completed: false,
    createdAt: createdAt,
    description: desc,
    dueDate: due,
    priority: prio,
    tags: tagsArray,
    userId: uid,
    attachments: []
  };
}

/**
 * 更新 todo（支持修改完成状态、标题、描述、截止日期、优先级和标签）
 */
function updateTodo(id, completed, title, description, dueDate, priority, tags) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      let newTitle = data[i][1];
      let newCompleted = data[i][2] === true || data[i][2] === 'TRUE';
      let newDescription = data[i][4] || '';
      let newDueDate = data[i][5] || '';
      let newPriority = data[i][6] || '';
      let newTags = [];
      if (data[i][8]) {
        try {
          newTags = JSON.parse(data[i][8]);
        } catch (e) {
          newTags = [];
        }
      }

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

      // 更新标签（如果提供）
      if (tags !== undefined && tags !== null) {
        const tagsJson = tags.length > 0 ? JSON.stringify(tags) : '';
        sheet.getRange(i + 1, 9).setValue(tagsJson);
        newTags = tags;
      }

      // 获取现有附件
      let attachments = [];
      if (data[i][10]) {
        try {
          attachments = JSON.parse(data[i][10]);
        } catch (e) {
          attachments = [];
        }
      }

      return {
        id: id,
        title: newTitle,
        completed: newCompleted,
        createdAt: data[i][3],
        description: newDescription,
        dueDate: newDueDate,
        priority: newPriority,
        tags: newTags,
        userId: data[i][9] || '',
        attachments: attachments
      };
    }
  }

  throw new Error('Todo not found: ' + id);
}

/**
 * 软删除 todo（设置 deleted 标志为 true）
 */
function deleteTodo(id) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.getRange(i + 1, 8).setValue(true); // 第8列为 deleted 标志
      return { id: id, deleted: true };
    }
  }

  throw new Error('Todo not found: ' + id);
}

/**
 * 获取已删除的 todos（按 userId 过滤）
 */
function getDeletedTodos(userId) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();

  const todos = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const isDeleted = row[7] === true || row[7] === 'TRUE';
    const rowUserId = row[9] || '';

    // 按 userId 过滤（如果提供了 userId）
    if (userId && rowUserId !== userId) {
      continue;
    }

    if (row[0] && isDeleted) { // 确保有 ID 且已删除
      let tags = [];
      if (row[8]) {
        try {
          tags = JSON.parse(row[8]);
        } catch (e) {
          tags = [];
        }
      }
      let attachments = [];
      if (row[10]) {
        try {
          attachments = JSON.parse(row[10]);
        } catch (e) {
          attachments = [];
        }
      }
      todos.push({
        id: row[0],
        title: row[1],
        completed: row[2] === true || row[2] === 'TRUE',
        createdAt: row[3],
        description: row[4] || '',
        dueDate: row[5] || '',
        priority: row[6] || '',
        tags: tags,
        userId: rowUserId,
        attachments: attachments
      });
    }
  }

  return todos;
}

/**
 * 恢复已删除的 todo（设置 deleted 标志为 false）
 */
function restoreTodo(id) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.getRange(i + 1, 8).setValue(false); // 第8列为 deleted 标志

      let tags = [];
      if (data[i][8]) {
        try {
          tags = JSON.parse(data[i][8]);
        } catch (e) {
          tags = [];
        }
      }

      let attachments = [];
      if (data[i][10]) {
        try {
          attachments = JSON.parse(data[i][10]);
        } catch (e) {
          attachments = [];
        }
      }

      return {
        id: data[i][0],
        title: data[i][1],
        completed: data[i][2] === true || data[i][2] === 'TRUE',
        createdAt: data[i][3],
        description: data[i][4] || '',
        dueDate: data[i][5] || '',
        priority: data[i][6] || '',
        tags: tags,
        userId: data[i][9] || '',
        attachments: attachments
      };
    }
  }

  throw new Error('Todo not found: ' + id);
}

/**
 * 永久删除所有已删除的 todos（清空回收站，按 userId 过滤）
 */
function emptyTrash(userId) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();

  // 从后往前删除，避免索引偏移问题
  let deletedCount = 0;
  for (let i = data.length - 1; i >= 1; i--) {
    const isDeleted = data[i][7] === true || data[i][7] === 'TRUE';
    const rowUserId = data[i][9] || '';

    // 按 userId 过滤（如果提供了 userId）
    if (userId && rowUserId !== userId) {
      continue;
    }

    if (data[i][0] && isDeleted) {
      sheet.deleteRow(i + 1);
      deletedCount++;
    }
  }

  return { deletedCount: deletedCount };
}

// ============ 附件功能 ============

/**
 * 获取或创建附件文件夹
 */
function getOrCreateAttachmentFolder() {
  const folders = DriveApp.getFoldersByName(ATTACHMENT_FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(ATTACHMENT_FOLDER_NAME);
}

/**
 * 上传附件到 Google Drive
 * @param {string} todoId - Todo ID
 * @param {string} fileName - 文件名
 * @param {string} mimeType - MIME 类型
 * @param {string} fileData - Base64 编码的文件数据
 */
function uploadAttachment(todoId, fileName, mimeType, fileData) {
  // 验证 MIME 类型
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new Error('不支持的文件类型: ' + mimeType);
  }

  // 解码 Base64 数据
  const decodedData = Utilities.base64Decode(fileData);
  const fileSize = decodedData.length;

  // 验证文件大小
  if (fileSize > MAX_FILE_SIZE) {
    throw new Error('文件大小超过限制 (最大 10MB)');
  }

  // 获取附件文件夹
  const folder = getOrCreateAttachmentFolder();

  // 创建文件
  const blob = Utilities.newBlob(decodedData, mimeType, fileName);
  const file = folder.createFile(blob);

  // 设置文件为任何人可通过链接查看
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  // 创建附件对象
  const attachment = {
    id: file.getId(),
    name: fileName,
    mimeType: mimeType,
    url: file.getUrl(),
    size: fileSize,
    uploadedAt: new Date().toISOString()
  };

  // 更新 Google Sheet 中的 attachments 字段
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === todoId) {
      // 获取现有附件
      let attachments = [];
      if (data[i][10]) {
        try {
          attachments = JSON.parse(data[i][10]);
        } catch (e) {
          attachments = [];
        }
      }

      // 添加新附件
      attachments.push(attachment);

      // 保存到 Sheet
      sheet.getRange(i + 1, 11).setValue(JSON.stringify(attachments));

      return attachment;
    }
  }

  // 如果找不到 todo，删除已上传的文件
  file.setTrashed(true);
  throw new Error('Todo not found: ' + todoId);
}

/**
 * 删除附件
 * @param {string} todoId - Todo ID
 * @param {string} attachmentId - 附件 ID (Google Drive 文件 ID)
 */
function deleteAttachment(todoId, attachmentId) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === todoId) {
      // 获取现有附件
      let attachments = [];
      if (data[i][10]) {
        try {
          attachments = JSON.parse(data[i][10]);
        } catch (e) {
          attachments = [];
        }
      }

      // 查找并删除附件
      const attachmentIndex = attachments.findIndex(a => a.id === attachmentId);
      if (attachmentIndex === -1) {
        throw new Error('Attachment not found: ' + attachmentId);
      }

      // 从 Google Drive 删除文件
      try {
        const file = DriveApp.getFileById(attachmentId);
        file.setTrashed(true);
      } catch (e) {
        // 文件可能已经被删除，继续执行
        Logger.log('File already deleted or not found: ' + attachmentId);
      }

      // 从数组中移除
      attachments.splice(attachmentIndex, 1);

      // 保存到 Sheet
      sheet.getRange(i + 1, 11).setValue(attachments.length > 0 ? JSON.stringify(attachments) : '');

      return { success: true, deletedId: attachmentId };
    }
  }

  throw new Error('Todo not found: ' + todoId);
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
  const expectedHeaders = ['id', 'title', 'completed', 'createdAt', 'description', 'dueDate', 'priority', 'deleted', 'tags', 'userId', 'attachments'];

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

/**
 * 清理孤立的 todos（没有有效 userId 的记录）
 * 在 GAS 编辑器中手动运行此函数
 * @param {string[]} validUserIds - 有效的生产环境用户 ID 列表
 */
function cleanupOrphanedTodos() {
  // 生产环境的有效用户 ID（从 Turso 数据库获取）
  const validUserIds = [
    'cmjrvsko300008atvodp1aqjc',  // joseph.siyi@gmail.com
    'cmjrvv7330000a97inhh7iwmy',  // joseph19820124@gmail.com
    'cmjrvwnm60001a97iqur3hx02',  // testprod@example.com
  ];

  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();

  // 从后往前删除，避免索引偏移问题
  let deletedCount = 0;
  const deletedTitles = [];

  for (let i = data.length - 1; i >= 1; i--) {
    const rowUserId = data[i][9] || '';
    const title = data[i][1] || '';

    // 如果 userId 为空或不在有效列表中，删除该行
    if (!rowUserId || !validUserIds.includes(rowUserId)) {
      deletedTitles.push(title);
      sheet.deleteRow(i + 1);
      deletedCount++;
    }
  }

  Logger.log('Cleanup completed!');
  Logger.log('Deleted ' + deletedCount + ' orphaned todos:');
  deletedTitles.forEach(function(title) {
    Logger.log('  - ' + title);
  });

  return { deletedCount: deletedCount, deletedTitles: deletedTitles };
}
