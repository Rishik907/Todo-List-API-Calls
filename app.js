const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");

const dbPath = path.join(__dirname, "todoApplication.db");

const app = express();
app.use(express.json());

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error ${e}`);
  }
};

initializeDBAndServer();

const checkRequestQuery = async (request, response, next) => {
  const { search_q, category, priority, status, date } = request.query;
  const { todoId } = request.params;
  if (category !== undefined) {
    const categoryList = ["WORK", "HOME", "LEARNING"];
    const categoryCheck = categoryList.includes(category);
    if (categoryCheck === true) {
      request.category = category;
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
      return;
    }
  }

  if (priority !== undefined) {
    const priorityList = ["HIGH", "MEDIUM", "LOW"];
    const priorityCheck = priorityList.includes(priority);
    if (priorityCheck === true) {
      request.priority = priority;
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
      return;
    }
  }

  if (status !== undefined) {
    const statusList = ["TO DO", "IN PROGRESS", "DONE"];
    const statusCheck = statusList.includes(status);
    if (statusCheck === true) {
      request.status = status;
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
      return;
    }
  }
  if (date !== undefined) {
    const { format, toDate, isValid } = require("date-fns");
    try {
      const myDate = new Date(date);
      let isValidDate = await isValid(myDate);
      if (isValidDate === true) {
        let check;
      } else {
        response.status(400);
        response.send("Invalid Due Date");
        return;
      }
      const formatedDate = format(new Date(date), "yyyy-MM-dd");
      const result = toDate(
        new Date(
          `${myDate.getFullYear()}-${myDate.getMonth() + 1}-${myDate.getDate()}`
        )
      );
      isValidDate = await isValid(result);
      if (isValidDate === true) {
        request.date = formatedDate;
      } else {
        response.status(400);
        response.send("Invalid Due Date");
        return;
      }
    } catch (e) {
      response.status(400);
      response.send("Invalid Due Date");
      return;
    }
  }
  request.todoId = todoId;
  request.search_q = search_q;
  next();
};

const checkRequestBody = async (request, response, next) => {
  const { id, todo, category, priority, status, dueDate } = request.body;
  const { todoId } = request.params;
  if (category !== undefined) {
    const categoryList = ["WORK", "HOME", "LEARNING"];
    const categoryCheck = categoryList.includes(category);
    if (categoryCheck === true) {
      request.category = category;
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
      return;
    }
  }

  if (priority !== undefined) {
    const priorityList = ["HIGH", "MEDIUM", "LOW"];
    const priorityCheck = priorityList.includes(priority);
    if (priorityCheck === true) {
      request.priority = priority;
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
      return;
    }
  }

  if (status !== undefined) {
    const statusList = ["TO DO", "IN PROGRESS", "DONE"];
    const statusCheck = statusList.includes(status);
    if (statusCheck === true) {
      request.status = status;
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
      return;
    }
  }
  if (dueDate !== undefined) {
    const { format, toDate, isValid } = require("date-fns");
    try {
      const myDate = new Date(dueDate);
      let isValidDate = await isValid(myDate);
      if (isValidDate === true) {
        let check;
      } else {
        response.status(400);
        response.send("Invalid Due Date");
        return;
      }
      const formatedDate = format(new Date(dueDate), "yyyy-MM-dd");
      const result = toDate(
        new Date(
          `${myDate.getFullYear()}-${myDate.getMonth() + 1}-${myDate.getDate()}`
        )
      );
      isValidDate = await isValid(result);
      if (isValidDate === true) {
        request.dueDate = formatedDate;
      } else {
        response.status(400);
        response.send("Invalid Due Date");
        return;
      }
    } catch (e) {
      response.status(400);
      response.send("Invalid Due Date");
      return;
    }
  }
  request.todoId = todoId;
  request.todo = todo;
  request.id = id;
  next();
};
//data conversion
const conversion = (data) => {
  return {
    id: data.id,
    todo: data.todo,
    priority: data.priority,
    status: data.status,
    category: data.category,
    dueDate: data.due_date,
  };
};

// // date valid change
// const dayConversion = (date) => {
//   let format = require("date-fns/format");
//   let dateArray = date.split("-");
//   let finalDate = format(
//     new Date(dateArray[0], dateArray[1], dateArray[2]),
//     "yyyy-MM-dd"
//   );
//   return finalDate;
// };

//get todo list with query's
app.get("/todos/", checkRequestQuery, async (request, response) => {
  const { search_q = "", status = "", priority = "", category = "" } = request;
  let getTodosQuery = `
  SELECT * FROM todo WHERE 
  todo LIKE '%${search_q}%' AND priority LIKE '%${priority}%'
  AND status LIKE '%${status}%' AND category LIKE '%${category}';
  `;
  let data = await db.all(getTodosQuery);
  const dataDetails = data.map((eachTodo) => conversion(eachTodo));
  response.send(dataDetails);
});

// get todo by id

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoByIdQuery = `
  SELECT * FROM todo 
  WHERE id = ${todoId};
  `;
  let data = await db.get(getTodoByIdQuery);
  console.log(data);
  const dataDetails = {
    id: data.id,
    todo: data.todo,
    priority: data.priority,
    status: data.status,
    category: data.category,
    dueDate: data.due_date,
  };
  response.send(dataDetails);
});

// get todo by date

app.get("/agenda/", checkRequestQuery, async (request, response) => {
  const { date } = request;
  const getTodoByDate = `
    SELECT * FROM todo 
    WHERE due_date LIKE '${date}';
    `;
  const data = await db.all(getTodoByDate);
  if (data === undefined) {
    response.send("Invalid Due Date");
  } else {
    const todoDetails = data.map((each) => conversion(each));
    response.send(todoDetails);
  }
});

//create todo list

app.post("/todos/", checkRequestBody, async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request;

  const createTodoQuery = `
    INSERT INTO todo (id,todo,category,priority,status,due_date)
    VALUES (${id},'${todo}','${category}','${priority}','${status}',${dueDate});
    `;
  await db.run(createTodoQuery);
  response.send("Todo Successfully Added");
});

//update a todo list

app.put("/todos/:todoId/", checkRequestBody, async (request, response) => {
  const { todoId } = request.params;
  let UpdateSentence = "";
  const requestBody = request.body;
  let check = false;
  switch (true) {
    case requestBody.status !== undefined:
      UpdateSentence = "Status Updated";
      break;
    case requestBody.priority !== undefined:
      UpdateSentence = "Priority Updated";
      break;
    case requestBody.todo !== undefined:
      UpdateSentence = "Todo Updated";
      break;
    case requestBody.category !== undefined:
      UpdateSentence = "Category Updated";
      break;
    case requestBody.dueDate !== undefined:
      check = true;
      UpdateSentence = "Due Date Updated";
      break;
  }
  const previousQuery = `
    SELECT * FROM todo 
    WHERE id = ${todoId};
    `;
  const previousData = await db.get(previousQuery);
  let {
    todo = previousData.todo,
    status = previousData.status,
    priority = previousData.priority,
    category = previousData.category,
    dueDate = previousData.due_date,
  } = request;
  const updateTodoQuery = `
  UPDATE 
    todo
  SET 
    todo = '${todo}',
    priority = '${priority}',
    status = '${status}',
    category = '${category}',
    due_date = ${dueDate}
  WHERE 
    id = ${todoId};
  `;
  await db.run(updateTodoQuery);
  response.send(UpdateSentence);
});

//delete todo
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE FROM 
    todo
    WHERE id = ${todoId};
    `;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
