import { initBotId } from "botid/client/core";

initBotId({
  protect: [
    { method: "POST", path: "/api/public/appointments/holds" },
    { method: "POST", path: "/api/public/appointments/requests" },
  ],
});
