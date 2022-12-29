import * as AWS from 'aws-sdk';
import { TodoItem } from '../models/TodoItem';
import { TodoUpdate } from '../models/TodoUpdate';

const AWSXRay = require('aws-xray-sdk')
const XAWS = AWSXRay.captureAWS(AWS)

export class TodosAccess {

    constructor(
        private readonly dynamoDBClient = new XAWS.DynamoDB.DocumentClient(),
        private readonly todosTable = process.env.TODOS_TABLE,
        private readonly todosIndex = process.env.TODOS_CREATED_AT_INDEX,
    ) {
    }

    async getTodosByUserID(userId: string): Promise<TodoItem[]> {
        const result = await this.dynamoDBClient
            .query({
                TableName: this.todosTable,
                IndexName: this.todosIndex,
                KeyConditionExpression: 'userId = :userId',
                ExpressionAttributeValues: {
                    ':userId': userId
                }
            })
            .promise()
        const items = result.Items
        return items as TodoItem[]
    }

    async createTodo(todo: TodoItem) {
        await this.dynamoDBClient.put({
            TableName: this.todosTable,
            Item: todo
        }).promise()
    }

    async updateTodo(userId: string, todoId: string, updatedTodo: TodoUpdate): Promise<{ Updated: any }> {
        const updtedTodo = await this.dynamoDBClient.update({
            TableName: this.todosTable,
            Key: { userId, todoId },
            ExpressionAttributeNames: { "#N": "name" },
            UpdateExpression: "set #N=:todoName, dueDate=:dueDate, done=:done",
            ExpressionAttributeValues: {
                ":todoName": updatedTodo.name,
                ":dueDate": updatedTodo.dueDate,
                ":done": updatedTodo.done
            },
            ReturnValues: "UPDATED_NEW"
        })
            .promise();
        return { Updated: updtedTodo };
    }

    async getTodoFromDB(todoId: string, userId: string) {
        const result = await this.dynamoDBClient.get({
            TableName: this.todosTable,
            Key: {
                todoId,
                userId
            }
        }).promise();
        return result.Item;
    }

    async deleteToDo(todoId: string, userId: string) {
        await this.dynamoDBClient.delete({
            TableName: this.todosTable,
            Key: {
                todoId,
                userId
            }
        }).promise();
    }
}