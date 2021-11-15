import WebSocket from "ws";
import { CloudFormation } from "@aws-sdk/client-cloudformation";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";

const cloudformation = new CloudFormation({});
let outputs;

const waitForSocketState = (socket, state) => {
  return new Promise((resolve) => {
    setTimeout(function () {
      if (socket.readyState === state) {
        resolve();
      } else {
        waitForSocketState(socket, state).then(resolve);
      }
    }, 5);
  });
};

beforeAll(async () => {
  const response = await cloudformation.describeStacks({
    StackName: process.env.STACK_NAME,
  });
  const [stack] = response.Stacks;
  outputs = Object.fromEntries(
    stack.Outputs.map((o) => [o.OutputKey, o.OutputValue])
  );
});

describe("Websockets", () => {
  it("should unsubscribe", async () => {
    const connectionId = "fakeConnetionId";
    const name = "test";

    // mock a subscription
    const dynamodb = new DynamoDB({});
    const dynamoClient = DynamoDBDocument.from(dynamodb);
    await dynamoClient.put({
      TableName: outputs.ApplicationDatabase,
      Item: {
        pk: `state#${name}`,
        sk: `connection#${connectionId}#subscription`,
      },
    });

    // TODO
    //   const action = JSON.stringify({ action: "subscribe", name });
    //   let reply;
    //   // Connect
    //   const wsClient = new WebSocket(outputs.WebSocketApi);
    //   await waitForSocketState(wsClient, wsClient.OPEN);
    //   // Callback when message received
    //   wsClient.on("message", (response) => {
    //     reply = new TextDecoder().decode(response);
    //     wsClient.close();
    //   });

    //   // Send message and await response
    //   wsClient.send(action);
    //   await waitForSocketState(wsClient, wsClient.CLOSED);
    //   expect(reply).toBe(JSON.stringify(value));
  });
});
