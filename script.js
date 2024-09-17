// script.js

document
  .getElementById("generate-grid")
  .addEventListener("click", generateCluesInput);
document.getElementById("solve-button").addEventListener("click", startSolving);
document.getElementById("export-button").addEventListener("click", exportClues);
document.getElementById("import-button").addEventListener("click", importClues);
document
  .getElementById("prev-solution")
  .addEventListener("click", showPreviousSolution);
document
  .getElementById("next-solution")
  .addEventListener("click", showNextSolution);
document.getElementById("load-non-file").addEventListener("click", loadNonFile);

let numRows, numCols;
let allSolutions = [];
let currentSolutionIndex = 0;

function generateCluesInput() {
  numRows = parseInt(document.getElementById("rows").value);
  numCols = parseInt(document.getElementById("cols").value);

  if (isNaN(numRows) || isNaN(numCols) || numRows <= 0 || numCols <= 0) {
    alert("Please enter valid grid sizes.");
    return;
  }

  document.getElementById("clues-inputs").style.display = "block";
  generateClueFields();
}

function generateClueFields(cluesData = null) {
  const colCluesContainer = document.getElementById("col-clues");
  const rowCluesContainer = document.getElementById("row-clues");
  const emptyGrid = document.getElementById("empty-grid");

  colCluesContainer.innerHTML = "";
  rowCluesContainer.innerHTML = "";
  emptyGrid.innerHTML = "";

  // Determine the size of the clue input fields based on grid size
  let clueSize = numRows > 20 || numCols > 20 ? 50 : 70; // Smaller size for large grids
  let fontSize = numRows > 20 || numCols > 20 ? 14 : 16;

  // Update CSS variables
  document.documentElement.style.setProperty("--clue-size", `${clueSize}px`);
  document.documentElement.style.setProperty(
    "--clue-font-size",
    `${fontSize}px`
  );

  // Create column clues
  colCluesContainer.style.gridTemplateColumns = `repeat(${numCols}, var(--clue-size))`;
  for (let c = 0; c < numCols; c++) {
    const clueDiv = document.createElement("div");
    clueDiv.classList.add("clue-input");
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = `Clue ${c + 1}`;
    clueDiv.appendChild(input);
    colCluesContainer.appendChild(clueDiv);

    // If importing clues, set the value
    if (cluesData && cluesData.colClues[c]) {
      input.value = cluesData.colClues[c];
    }
  }

  // Create row clues
  rowCluesContainer.style.gridTemplateRows = `repeat(${numRows}, var(--clue-size))`;
  for (let r = 0; r < numRows; r++) {
    const clueDiv = document.createElement("div");
    clueDiv.classList.add("clue-input");
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = `Clue ${r + 1}`;
    clueDiv.appendChild(input);
    rowCluesContainer.appendChild(clueDiv);

    // If importing clues, set the value
    if (cluesData && cluesData.rowClues[r]) {
      input.value = cluesData.rowClues[r];
    }
  }

  // Empty grid cells for alignment
  emptyGrid.style.gridTemplateColumns = `repeat(${numCols}, var(--clue-size))`;
  emptyGrid.style.gridTemplateRows = `repeat(${numRows}, var(--clue-size))`;

  for (let r = 0; r < numRows * numCols; r++) {
    const cellDiv = document.createElement("div");
    cellDiv.classList.add("clue-input");
    emptyGrid.appendChild(cellDiv);
  }
}

function startSolving() {
  const rowClues = getClues("row-clues", numRows);
  const colClues = getClues("col-clues", numCols);

  if (!rowClues || !colClues) {
    alert("Please enter valid clues.");
    return;
  }

  console.log("Starting solver with the following clues:");
  console.log("Row Clues:", rowClues);
  console.log("Column Clues:", colClues);

  document.getElementById("progress-container").style.display = "block";
  document.getElementById("solution-container").style.display = "none";
  document.getElementById("progress-bar").value = 0;

  // Start the solving process using a Web Worker
  const worker = new Worker("solverWorker.js");
  worker.postMessage({ rowClues, colClues });

  worker.onmessage = function (e) {
    const { progress, solutions } = e.data;
    if (progress !== undefined) {
      document.getElementById("progress-bar").value = progress;
    }
    if (progress === 100) {
      worker.terminate();
      document.getElementById("progress-container").style.display = "none";
      if (solutions && solutions.length > 0) {
        currentSolutionIndex = 0;
        allSolutions = solutions;
        displaySolution(allSolutions[currentSolutionIndex]);
        document.getElementById("solution-navigation").style.display = "block";
        document.getElementById("solution-count").textContent = `Solution ${
          currentSolutionIndex + 1
        } of ${allSolutions.length}`;
      } else {
        alert("No solution found for the given clues.");
      }
    }
  };
}

function getClues(containerId, count) {
  const container = document.getElementById(containerId);
  const inputs = container.getElementsByTagName("input");
  const clues = [];
  for (let i = 0; i < count; i++) {
    const input = inputs[i];
    if (input.value.trim() === "0") {
      clues.push([]); // Treat "0" as an empty clue
      continue;
    }
    const values = input.value
      .trim()
      .split(/\s+/)
      .map(Number)
      .filter((n) => !isNaN(n) && n > 0);
    if (input.value.trim() !== "" && values.length === 0) {
      console.log("Invalid clue:", input.value);
      alert("Clues must be positive numbers separated by spaces.");
      return null;
    }
    clues.push(values);
  }
  return clues;
}

function displaySolution(grid) {
  const solutionGrid = document.getElementById("solution-grid");
  solutionGrid.innerHTML = "";
  const rows = grid.length;
  const cols = grid[0].length;
  solutionGrid.style.gridTemplateColumns = `repeat(${cols}, 20px)`;

  for (let row of grid) {
    for (let cell of row) {
      const cellDiv = document.createElement("div");
      cellDiv.classList.add(cell ? "cell-filled" : "cell-empty");
      solutionGrid.appendChild(cellDiv);
    }
  }
  document.getElementById("solution-container").style.display = "block";
}

function showPreviousSolution() {
  if (currentSolutionIndex > 0) {
    currentSolutionIndex--;
    displaySolution(allSolutions[currentSolutionIndex]);
    document.getElementById("solution-count").textContent = `Solution ${
      currentSolutionIndex + 1
    } of ${allSolutions.length}`;
  }
}

function showNextSolution() {
  if (currentSolutionIndex < allSolutions.length - 1) {
    currentSolutionIndex++;
    displaySolution(allSolutions[currentSolutionIndex]);
    document.getElementById("solution-count").textContent = `Solution ${
      currentSolutionIndex + 1
    } of ${allSolutions.length}`;
  }
}

// Export clues to a string and copy to clipboard
function exportClues() {
  const rowCluesInputs = document
    .getElementById("row-clues")
    .getElementsByTagName("input");
  const colCluesInputs = document
    .getElementById("col-clues")
    .getElementsByTagName("input");

  const cluesData = {
    rows: numRows,
    cols: numCols,
    rowClues: [],
    colClues: [],
  };

  for (let input of rowCluesInputs) {
    cluesData.rowClues.push(input.value.trim());
  }

  for (let input of colCluesInputs) {
    cluesData.colClues.push(input.value.trim());
  }

  const cluesString = JSON.stringify(cluesData);
  navigator.clipboard.writeText(cluesString).then(
    () => {
      alert("Clues exported to clipboard!");
    },
    () => {
      alert("Failed to copy clues to clipboard.");
    }
  );
}

// Import clues from a string
function importClues() {
  const importInput = document.getElementById("import-input");
  const cluesString = importInput.value.trim();

  if (!cluesString) {
    alert("Please paste the exported clues into the input field.");
    return;
  }

  try {
    const cluesData = JSON.parse(cluesString);

    if (
      !cluesData.rows ||
      !cluesData.cols ||
      !cluesData.rowClues ||
      !cluesData.colClues
    ) {
      throw new Error("Invalid clues data.");
    }

    // Set grid sizes
    document.getElementById("rows").value = cluesData.rows;
    document.getElementById("cols").value = cluesData.cols;

    numRows = cluesData.rows;
    numCols = cluesData.cols;

    // Generate grid and populate clues
    document.getElementById("clues-inputs").style.display = "block";
    generateClueFields(cluesData);

    alert("Clues imported successfully!");
  } catch (e) {
    alert("Failed to import clues. Please ensure the data is correct.");
    console.error(e);
  }
}

function loadNonFile() {
  const fileInput = document.getElementById("non-file-input");
  const file = fileInput.files[0];

  if (!file) {
    alert("Please select a .non file to load.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    const content = e.target.result;
    try {
      const puzzleData = parseNonFile(content);
      importNonPuzzle(puzzleData);
      alert("Puzzle imported successfully!");
    } catch (error) {
      alert(
        "Failed to parse the .non file. Please ensure the file is in the correct format."
      );
      console.error(error);
    }
  };
  reader.readAsText(file);
}

function parseNonFile(content) {
  const lines = content.split("\n");
  let width = null;
  let height = null;
  const rowClues = [];
  const colClues = [];
  let readingRows = false;
  let readingCols = false;

  for (let line of lines) {
    line = line.trim();

    // Ignore comments and blank lines
    if (line === "" || line.startsWith("#")) {
      continue;
    }

    // Check for 'rows' and 'columns' keywords
    if (line.toLowerCase() === "rows") {
      readingRows = true;
      readingCols = false;
      continue;
    } else if (line.toLowerCase() === "columns") {
      readingCols = true;
      readingRows = false;
      continue;
    }

    // Check for other key-value pairs
    const keyValueMatch = line.match(/^(\w+)\s+(.*)$/);
    if (keyValueMatch) {
      const key = keyValueMatch[1].toLowerCase();
      const value = keyValueMatch[2].trim();

      if (key === "width") {
        width = parseInt(value);
        if (isNaN(width)) {
          throw new Error("Invalid width value.");
        }
      } else if (key === "height") {
        height = parseInt(value);
        if (isNaN(height)) {
          throw new Error("Invalid height value.");
        }
      }
      // Reset reading flags for other key-value pairs
      readingRows = false;
      readingCols = false;
      continue;
    }

    // Read clues
    if (readingRows) {
      rowClues.push(parseClueLine(line));
    } else if (readingCols) {
      colClues.push(parseClueLine(line));
    }
  }

  if (width === null || height === null) {
    throw new Error("Width and height must be specified.");
  }

  if (rowClues.length !== height) {
    throw new Error(
      `Expected ${height} rows of clues, but got ${rowClues.length}.`
    );
  }

  if (colClues.length !== width) {
    throw new Error(
      `Expected ${width} columns of clues, but got ${colClues.length}.`
    );
  }

  return {
    width,
    height,
    rowClues,
    colClues,
  };
}

function parseClueLine(line) {
  if (line === "") {
    return [];
  }
  // Split by commas and parse numbers
  const clues = line.split(",").map((part) => parseInt(part.trim(), 10));
  if (clues.some(isNaN)) {
    throw new Error(`Invalid clue format: ${line}`);
  }
  return clues;
}

function importNonPuzzle(puzzleData) {
  // Set grid sizes
  numRows = puzzleData.height;
  numCols = puzzleData.width;
  document.getElementById("rows").value = numRows;
  document.getElementById("cols").value = numCols;

  // Prepare clues data
  const cluesData = {
    rows: numRows,
    cols: numCols,
    rowClues: puzzleData.rowClues.map((clues) => clues.join(" ")),
    colClues: puzzleData.colClues.map((clues) => clues.join(" ")),
  };

  // Generate grid and populate clues
  document.getElementById("clues-inputs").style.display = "block";
  generateClueFields(cluesData);
}
