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
  it("TODO: email magic link", async () => {
    // TODO
  });
});
