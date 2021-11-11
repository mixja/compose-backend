import WebSocket from "ws";
import { CloudFormation } from "@aws-sdk/client-cloudformation";

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
  it("should subscribe and receive the current state", async () => {
    const action = JSON.stringify({ action: "subscribe", name: "test" });
    let reply;
    // Connect
    const client = new WebSocket(outputs.WebSocketApi);
    await waitForSocketState(client, client.OPEN);
    // Callback when message received
    client.on("message", (response) => {
      reply = new TextDecoder().decode(response);
      console.log(reply);
      client.close();
    });

    // Send message and await response
    client.send(action);
    await waitForSocketState(client, client.CLOSED);
    console.log(reply);
    // expect(reply).toBe(message)
  });
});
