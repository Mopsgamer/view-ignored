#! /usr/bin/env node
import { programInit, program } from "./cli.js";
programInit().then(() => program.parse())
