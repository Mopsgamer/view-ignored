#! /usr/bin/env node
import {program} from "./cli.js";
import { configEditor } from "./config.js";
configEditor.load()
program.parse()
