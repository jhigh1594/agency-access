#!/usr/bin/env node
import { createProgram } from '../index.js';

const program = createProgram();
void program.parseAsync(process.argv);
