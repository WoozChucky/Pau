import morgan, {StreamOptions} from "morgan";
import {Logger} from "../../utils/logging";

// Override the stream method by telling
// Morgan to use our custom logger instead of the console.log.
const stream: StreamOptions = {
  write: (message: string) => Logger.http(message)
};

// Skip all the Morgan http log if the
// application is not running in development mode.
const skip = () => {
    const env = process.env.NODE_ENV || "development";
    return env !== "development";
};

// Build the morgan middleware
export const morganMiddleware = morgan(
    ":method :url :status :res[content-length] - :response-time ms",
    { stream, skip }
)
