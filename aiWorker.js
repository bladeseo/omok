onmessage = function (e) {
    const { board, depth, player } = e.data;
    const SIZE = board.length;

    function getCandidateMoves(board) {
        const moves = [];
        const range = 1; // 2?

        for (let x = 0; x < SIZE; x++) {
            for (let y = 0; y < SIZE; y++) {
                if (board[x][y] !== 0) continue;
                for (let dx = -range; dx <= range; dx++) {
                    for (let dy = -range; dy <= range; dy++) {
                        const nx = x + dx, ny = y + dy;
                        if (
                            nx >= 0 && ny >= 0 && nx < SIZE && ny < SIZE &&
                            board[nx][ny] !== 0
                        ) {
                            moves.push([x, y]);
                            dx = dy = range + 1;
                        }
                    }
                }
            }
        }
        return moves;
    }

    function evaluateBoardPattern(board, player) {
        let score = 0;
        const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];

        function countPattern(x, y, dx, dy) {
            let count = 0, block = 0;
            for (let i = 1; i <= 4; i++) {
                const nx = x + dx * i, ny = y + dy * i;
                if (nx < 0 || ny < 0 || nx >= SIZE || ny >= SIZE) { block++; break; }
                const cell = board[nx][ny];
                if (cell === player) count++;
                else if (cell === 0) break;
                else { block++; break; }
            }
            for (let i = 1; i <= 4; i++) {
                const nx = x - dx * i, ny = y - dy * i;
                if (nx < 0 || ny < 0 || nx >= SIZE || ny >= SIZE) { block++; break; }
                const cell = board[nx][ny];
                if (cell === player) count++;
                else if (cell === 0) break;
                else { block++; break; }
            }
            // if (count >= 4) return 100000;
            // if (count === 3 && block === 0) return 5000;
            // if (count === 3 && block === 1) return 1000;
            // if (count === 2 && block === 0) return 500;
            // if (count === 2 && block === 1) return 100;
            // if (count === 1 && block === 0) return 50;

            if (count >= 4) return 100000;
            if (count === 3 && block === 0) return 5000;
            if (count === 3 && block === 1) return 1000;
            if (count === 2 && block === 0) return 500;
            if (count === 2 && block === 1) return 100;
            if (count === 1 && block === 0) return 50;
            if (count === 1 && block === 1) return 25;
            // if (count === 0 && block === 1) return 10;
            if (count === 0 && block === 0) return 5;

            return 0;
        }

        for (let x = 0; x < SIZE; x++) {
            for (let y = 0; y < SIZE; y++) {
                if (board[x][y] === player) {
                    for (let [dx, dy] of directions) {
                        score += countPattern(x, y, dx, dy);
                    }
                }
            }
        }
        return score;
    }

    function minimax(board, depth, isMax, alpha, beta, player) {
        if (depth === 0) return evaluateBoardPattern(board, player);
        const moves = getCandidateMoves(board);
        let bestScore = isMax ? -Infinity : Infinity;

        for (let [x, y] of moves) {
            board[x][y] = player;
            const score = minimax(board, depth - 1, !isMax, alpha, beta, 3 - player);
            board[x][y] = 0;

            if (isMax) {
                bestScore = Math.max(bestScore, score);
                alpha = Math.max(alpha, score);
            } else {
                bestScore = Math.min(bestScore, score);
                beta = Math.min(beta, score);
            }
            if (beta <= alpha) break;
        }
        return bestScore;
    }

    function findBestMove(board, player) {
        let bestScore = -Infinity;
        let bestMove = null;

        for (let [x, y] of getCandidateMoves(board)) {
            board[x][y] = player;
            const score = minimax(board, depth - 1, false, -Infinity, Infinity, 3 - player);
            board[x][y] = 0;
            if (score > bestScore) {
                bestScore = score;
                bestMove = [x, y, bestScore];
            }
        }

        console.log('bestScore : ', bestScore);

        return bestMove || [Math.floor(SIZE / 2), Math.floor(SIZE / 2), 0];
    }

    function findBlockingMove(opponent) {
        const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];

        for (let x = 0; x < SIZE; x++) {
            for (let y = 0; y < SIZE; y++) {
                if (board[x][y] !== 0) continue;
                for (let [dx, dy] of directions) {
                    let count = 0;
                    for (let i = 1; i <= 4; i++) {
                        const nx = x + dx * i;
                        const ny = y + dy * i;
                        if (nx < 0 || ny < 0 || nx >= SIZE || ny >= SIZE) break;
                        if (board[nx][ny] === opponent) count++;
                        else break;
                    }
                    for (let i = 1; i <= 4; i++) {
                        const nx = x - dx * i;
                        const ny = y - dy * i;
                        if (nx < 0 || ny < 0 || nx >= SIZE || ny >= SIZE) break;
                        if (board[nx][ny] === opponent) count++;
                        else break;
                    }
                    if (count >= 3) return [x, y, 0];
                }
            }
        }
        return null;
    }


    const blockMove = findBlockingMove(1); // 사용자(흑) 차단 우선
    const bestMove = findBestMove(board, player);
    
    // postMessage(bestMove);

    // 한쪽 막힌 3개 미만이면 수비
    console.log('blockMove : ', blockMove)
    console.log('bestMove : ', bestMove)

    if (blockMove && bestMove[2] < 100000) {
        postMessage(blockMove);
    } else {
        postMessage(bestMove);
    }

};