
class Pixel {
    constructor(element) {
        this.r = 0.0;
        this.g = 0.0;
        this.b = 0.0;
        this.a = 0.0;
        this.element = element;
    }

    setColor(r, g, b, a) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
        this.element.style.backgroundColor = "rgba(" + r + ", " + g + ", " + b + ", " + a + ")";
    }

    sumColors(r, g, b, a) {
        this.r = Math.min(255, this.r + r);
        this.g = Math.min(255, this.g + g);
        this.b = Math.min(255, this.b + b);
        this.a = Math.min(1, this.a + a);
        this.element.style.backgroundColor = "rgba(" + this.r + ", " + this.g + ", " + this.b + ", " + this.a + ")";
    }

}

class Matrix {
    constructor(rows, cols) {
        this.rs = rows;
        this.cs = cols;
        this.data = new Array(rows);
        for (let i = 0; i < rows; i++) {
            this.data[i] = new Array(cols);
            for (let j = 0; j < cols; j++) this.data[i][j] = 0.0; 
        }
    }

    get rows() { return this.rs; }
    get cols() { return this.cs; }
    get size() { return this.rs * this.cs; }

    get_at(i, j) { return this.data[i][j]; }
    get_at(i) { return this.data[i][0]; }

    set_at(num, i, j) {
        if (i < 0 || i >= this.rs) throw new Error("Index is out of row bounds," + i);
        if (j < 0 || j >= this.cs) throw new Error("Index is out of col bounds," + j);
        this.data[i][j] = num; 
    }

    // Vector multiplication, assume other.rows() = 1
    multiply( other ) {
        if (this.cs != other.rows ) throw new Error("this.rows must equal other.cols");
        let out = new Matrix( this.rs, 1 );
        for (let i = 0; i < this.rs; i++) {
            let sum = 0;
            for (let j = 0; j < this.cs; j++) sum += this.data[i][j] * other.get_at(j, 0);
            out.set_at(sum, i, 0);
        }
        return out;
    }

    add( other ) {
        if (this.rs != other.rows || this.cs != other.cols) throw new Error( "Rows and cols must be equal for an addition" );
        let out = new Matrix( this.rs, this.cs );
        for (let i = 0; i < this.rs; i++) {
            for (let j = 0; j < this.cs; j++) out.set_at(other.get_at(i, j) + this.data[i][j], i, j);
        }
        return out;
    }
}

const rows = document.getElementsByClassName("row");
let guesses = document.getElementById("guesses").getElementsByTagName("b");
let pixels = Array(28);

let mdown = false;
document.addEventListener("mousedown", function() { mdown = true; });
document.addEventListener("mouseup", function() { mdown = false; });
document.getElementById("reset").addEventListener( "click", function() { clearCanvas() } );

for (let i = 0; i < rows.length; i++) {
    pixels[i] = Array(28);
    rows[i].setAttribute("draggable", false);
    for (let j = 0; j < rows[i].childElementCount; j++) {
        pixels[i][j] = new Pixel(rows[i].children[j]);
        pixels[i][j].element.addEventListener( "mouseover", function() { if (mdown) draw(i, j);  });
        pixels[i][j].element.addEventListener( "mousedown", function() { draw(i, j); });
        pixels[i][j].element.setAttribute("draggable", false);
    }
}

function draw(r, c) {
    pixels[r][c].sumColors(255, 255, 255, 0.5);
    if (r > 0) {
        pixels[r - 1][c].sumColors(255, 255, 255, 0.25);
    }
    if (r < pixels.length - 1) {
        pixels[r + 1][c].sumColors(255, 255, 255, 0.25);
    }
    if (c > 0) {
        pixels[r][c - 1].sumColors(255, 255, 255, 0.25);
    }
    if (c < pixels[r].length - 1) {
        pixels[r][c + 1].sumColors(255, 255, 255, 0.25);
    }

    feedforward();

}

function sigInPlace( matrix ) {
    for (let i = 0; i < matrix.rows; i++) {
        for (let j = 0; j < matrix.cols; j++) matrix.set_at( 1.0 / (1 + Math.exp( -matrix.get_at(i, j) )), i, j);
    }
}

function accuracyToString( num ) {
    let rounded = Math.floor( 10 * num );
    switch (rounded) {
        case 0:
            return { text: "Impossible", color: "rgb(255, 0, 0)" };
        case 1:
            return { text: "Improbable", color: "rgb(204, 0, 0)" };
        case 2:
            return { text: "Unlikely", color: "rgb(153, 0, 0)" };
        case 3:
            return { text: "Nope", color: "rgb(102, 0, 0)" };
        case 4:
            return { text: "Nah", color: "rgb(51, 0, 0)" };
        case 5:
            return { text: "Maybe", color: "rgb(0, 51, 0)" };
        case 6:
            return { text: "Possibly", color: "rgb(0, 102, 0)" };
        case 7:
            return { text: "Perhaps", color: "rgb(0, 153, 0)" };
        case 8:
            return { text: "Likely", color: "rgb(0, 204, 0)" };
        case 9:
            return { text: "Absolutely", color: "rgb(0, 255, 0)" };
        default:
            return { text: "?", color: "blue" };
    }
}

function feedforward() {
    // Convert pixel grid into vector
    let x = new Matrix(784, 1);
    let at = 0.0;
    
    for (let i = 0; i < pixels.length; i++) {
        for (let j = 0; j < pixels[i].length; j++) {
                x.set_at( pixels[i][j].a, at, 0 );
                at++;
        }
    }

    // Do feedforward
    for (let i = 0; i < weights.length; i++) {
        x = weights[i].multiply(x);
        x = x.add( biases[i] );
        sigInPlace(x);
    }

    for (let i = 0; i < guesses.length; i++) {
        let output_style = accuracyToString( x.get_at(i, 0) );
        guesses[i].textContent = output_style.text;
        guesses[i].style.color = output_style.color;
    }

}


function clearCanvas() {
    pixels.forEach(row => {
        row.forEach(pixel => {
            pixel.setColor(0.0, 0.0, 0.0, 0.0);
        })
    });

    for (let i = 0; i < guesses.length; i++) guesses[i].textContent = "";

}

let weights = [];
let biases = [];
getJSON();

// Load json data
async function getJSON() {
    const response = await fetch( "./matrixinfo.json" );
    const data = await response.json();
    
    // Get biases
    for (let i = 0; i < data["biases"].length; i++) {
        biases[i] = new Matrix( data["biases"][i].length, 1 );
        for (let j = 0; j < data[ "biases" ][i].length; j++ ) biases[i].set_at( data["biases"][i][j], j, 0);
    }

    // Get weights
    for (let i = 0; i < data["weights"].length; i++) {
        var w = new Matrix( data["weights"][i].length, data["weights"][i][0].length );
        weights[i] = w;
        for (let j = 0; j < data["weights"][i].length; j++) {
            for (let k = 0; k < data["weights"][i][j].length; k++) {
                weights[i].set_at( data["weights"][i][j][k], j, k);
            }
        }
    }
}