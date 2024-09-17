// solverWorker.js
self.onmessage = function (e) {
  const { rowClues, colClues } = e.data;
  console.log("Worker received clues:");
  console.log("Row Clues:", rowClues);
  console.log("Column Clues:", colClues);
  const solutions = solveNonogram(rowClues, colClues);
  self.postMessage({ progress: 100, solutions });
};

function solveNonogram(rowClues, colClues) {
  const rows = rowClues.length;
  const cols = colClues.length;
  const grid = Array(rows)
    .fill()
    .map(() => Array(cols).fill(null));

  self.postMessage({ progress: 5 });

  // Generate all possible line permutations for rows and columns
  const rowOptions = rowClues.map((clue, index) => {
    const options = generateLineOptions(clue, cols);
    console.log(`Row ${index + 1} options count: ${options.length}`);
    self.postMessage({ progress: 5 + (index / rowClues.length) * 20 });
    return options;
  });

  self.postMessage({ progress: 25 });

  const colOptions = colClues.map((clue, index) => {
    const options = generateLineOptions(clue, rows);
    console.log(`Column ${index + 1} options count: ${options.length}`);
    self.postMessage({ progress: 25 + (index / colClues.length) * 20 });
    return options;
  });

  self.postMessage({ progress: 45 });

  // Check for impossible clues
  if (
    rowOptions.some((opt) => opt.length === 0) ||
    colOptions.some((opt) => opt.length === 0)
  ) {
    console.error(
      "No possible options for a row or column. No solution exists."
    );
    return []; // No possible options for a row or column
  }

  const solutions = [];
  const maxSolutions = 100000; // Limit to prevent excessive computation

  backtrack(0, grid, rowOptions, colOptions, solutions, maxSolutions, rows);
  return solutions;
}

function backtrack(
  row,
  grid,
  rowOptions,
  colOptions,
  solutions,
  maxSolutions,
  totalRows
) {
  if (solutions.length >= maxSolutions) {
    return; // Stop if max solutions reached
  }
  if (row === grid.length) {
    // Deep copy the grid to save the solution
    const solution = grid.map((r) => r.slice());
    solutions.push(solution);
    return;
  }

  // Update progress based on the current row being processed
  self.postMessage({ progress: 45 + (row / totalRows) * 55 });

  for (let rowOption of rowOptions[row]) {
    // Tentatively assign rowOption to grid
    const oldGridRow = grid[row].slice();
    grid[row] = rowOption.slice();

    // Prune column options
    const oldColOptions = colOptions.map((colOpt) => colOpt.slice());
    let colsCompatible = true;
    for (let col = 0; col < grid[0].length; col++) {
      colOptions[col] = colOptions[col].filter(
        (option) => option[row] === grid[row][col]
      );
      if (colOptions[col].length === 0) {
        colsCompatible = false;
        break;
      }
    }

    if (colsCompatible) {
      backtrack(
        row + 1,
        grid,
        rowOptions,
        colOptions,
        solutions,
        maxSolutions,
        totalRows
      );
    }

    // Backtrack
    grid[row] = oldGridRow;
    // Restore colOptions
    for (let col = 0; col < grid[0].length; col++) {
      colOptions[col] = oldColOptions[col];
    }
  }
}

function generateLineOptions(clueArray, length) {
  const clues = clueArray.map(Number);
  const options = [];

  function dfs(pos, clueIndex, line) {
    if (clueIndex === clues.length) {
      // Fill the rest with zeros
      if (line.length < length) {
        line = line.concat(Array(length - line.length).fill(0));
      }
      if (line.length === length) {
        options.push(line);
      }
      return;
    }

    const remainingClues = clues.slice(clueIndex);
    const minLen =
      remainingClues.reduce((sum, val) => sum + val, 0) +
      (remainingClues.length - 1);
    for (let i = pos; i <= length - minLen; i++) {
      // Add zeros before the block
      const newLine = line.concat(Array(i - line.length).fill(0));
      // Add the block
      newLine.push(...Array(clues[clueIndex]).fill(1));
      // Add a zero if not the last block
      if (clueIndex < clues.length - 1) {
        newLine.push(0);
      }
      dfs(newLine.length, clueIndex + 1, newLine);
    }
  }

  dfs(0, 0, []);
  return options;
}
