import { getTimeStamps } from '../helpers/utils';

const info = (namespace: String, message: string, object?: String) => {
  if (object) {
    console.log(`[${getTimeStamps()}] [INFO] [${namespace}] ${message}`, object);
  } else {
    console.log(`[${getTimeStamps()}] [INFO] [${namespace}] ${message}`);
  }
};

const warn = (namespace: string, message: string, object?: any) => {
  if (object) {
    console.log(`[${getTimeStamps()}] [WARN] [${namespace}] ${message}`, object);
  } else {
    console.info(`[${getTimeStamps()}] [WARN] [${namespace}] ${message}`);
  }
};

const error = (namespace: string, message: string, object?: any) => {
  if (object) {
    console.error(`[${getTimeStamps()}] [ERROR] [${namespace}] ${message}`, object);
  } else {
    console.error(`[${getTimeStamps()}] [ERROR] [${namespace}] ${message}`);
  }
};

const debug = (namespace: string, message: string, object?: any) => {
  if (object) {
    console.debug(`[${getTimeStamps()}] [DEBUG] [${namespace}] ${message}`, object);
  } else {
    console.debug(`[${getTimeStamps()}] [DEBUG] [${namespace}] ${message}`);
  }
};

export = {
  debug,
  info,
  warn,
  error,
};
