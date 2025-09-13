onmessage = function (e) {
    const { SIZE, selectedWinningLength, board, depth, player } = e.data;
    
    const EMPTY = 0;
    

    function getOpponentStones(boardSize, board) {
        const opponentStones = [];

        // 보드 전체 좌표 스캐닝
        for (let x = 0; x < boardSize; x++) {
            for (let y = 0; y < boardSize; y++) {
                
                // 내 돌이면 통과
                if (board[x][y] === player) continue;

                // 상대 돌이면 결과에 추가
                if (
                    x >= 0 && y >= 0 
                    && x < boardSize && y < boardSize
                    && board[x][y] === (3 - player)
                ) {
                    opponentStones.push([x, y]);
                }
            }
        }

        console.log('opponentStones : ', opponentStones)

        return opponentStones;
    }

    // 빈 공간 계산 함수
    // 공간이 아니라 라인 상 갯수를 따지는 듯..
    // 틀렸다고 보기에는 애매하나...
    function countEmptySpaces(emptyLimitSize, x, y, dx, dy) {
        console.log(`emptyLimitSize : ${emptyLimitSize}`);

        let count = 0;
        for (let i = 1; i < emptyLimitSize; i++) {
            const nx = x + dx * i;
            const ny = y + dy * i;
            
            if (
                x >= 0 &&
                y >= 0 &&
                nx >= 0 &&
                ny >= 0 &&
                nx < emptyLimitSize &&
                ny < emptyLimitSize &&
                board[nx][ny] === EMPTY
            ) {
                count++;
            } else {
                break;
            }
        }
        return count;
    }

    // 가장 넓은 방향 찾기
    function findBestMoveByEmptySpace(boardSize, opponentStones) {

        let emptyLimitSize = 10;


        // 8방향 벡터
        // [dx, dy]
        const directions = [
            [1, 0], [-1, 0], [0, 1], [0, -1], // 상하좌우
            [1, 1], [1, -1], [-1, 1], [-1, -1], // 대각선

            // [-1, 0], [1, 0], [0, -1], [0, 1], // 상하좌우
            // [-1, -1], [-1, 1], [1, -1], [1, 1] // 대각선
        ];
        
        let bestMove = null;
        let maxSpace = -1;

        for (const [x, y] of opponentStones) {

            console.log(`opp. x : ${x}, opp. y : ${y} =====`);

            for (const [dx, dy] of directions) {

                let sumSpace = 0;

                // dx, dy 에 따라
                // x, y 를 주변 여러 개로 뿌려서 확인 => 8개로 고정
                for (let ax = -1; ax <= 1; ax++) {
                    for (let ay = -1; ay <= 1; ay++) {
                        const space = countEmptySpaces(emptyLimitSize, x + ax, y + ay, dx, dy);

                        // console.log(`dx : ${dx}, dy : ${dy}, space : ${space}`);

                        sumSpace += space;
                    }
                }

                console.log(`dx : ${dx}, dy : ${dy}, sumSpace : ${sumSpace}`);

                // 동점이라면 여러개 결과가 나가도록?
                // => 대각선을 우선하도록
                if (sumSpace >= maxSpace) {
                    // sumSpace 가 동일하면 대각선 위치로 업데이트
                    if (sumSpace === maxSpace) {
                        if ((Math.abs(dx) + Math.abs(dy)) === 2) {
                            maxSpace = sumSpace;
                            bestMove = [x + dx, y + dy];
                        }
                    } else {
                        maxSpace = sumSpace;
                        bestMove = [x + dx, y + dy];
                    }
                    
                }
                
            }
        }

        return bestMove;
    }


    function getCandidateMovesForMinimax(board) {
        const moves = [];
        const range = 2; // 돌이 있는 곳 +- 2개 범위로 탐색 => 결과적으로 5x5 영역 탐색

        // 돌을 둘 수 있는 전체 좌표 스캐닝
        for (let x = 0; x < SIZE; x++) {
            for (let y = 0; y < SIZE; y++) {
                
                // 빈 칸 아니면 통과
                if (board[x][y] !== EMPTY) continue;

                // 빈 칸만 확인
                // console.log(`x : ${x}, y : ${y}`);

                for (let dx = -range; dx <= range; dx++) {
                    for (let dy = -range; dy <= range; dy++) {
                        const nx = x + dx, ny = y + dy;
                        
                        // range 칸 수 이내에 돌이 있으면 추가??
                        if (
                            nx >= 0 && ny >= 0 
                            && nx < SIZE && ny < SIZE
                            && board[nx][ny] !== 0
                        ) {
                            moves.push([x, y]);
                            dx = dy = range + 1; // 2 중 loop 모두 종료의 의도

                            console.log(`dx : ${dx}, dy : ${dy}`);
                        }
                    }
                }
            }
        }

        // console.log('moves : ', moves)

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
                else if (cell === EMPTY) break;
                else { block++; break; }
            }
            for (let i = 1; i <= 4; i++) {
                const nx = x - dx * i, ny = y - dy * i;
                if (nx < 0 || ny < 0 || nx >= SIZE || ny >= SIZE) { block++; break; }
                const cell = board[nx][ny];
                if (cell === player) count++;
                else if (cell === EMPTY) break;
                else { block++; break; }
            }
            // if (count >= 4) return 100000;
            // if (count === 3 && block === 0) return 5000;
            // if (count === 3 && block === 1) return 1000;
            // if (count === 2 && block === 0) return 500;
            // if (count === 2 && block === 1) return 100;
            // if (count === 1 && block === 0) return 50;

            if (selectedWinningLength === 4) {
                if (count >= 3) return 200000;
                if (count === 2 && block === 0) return 10000;
                if (count === 2 && block === 1) return 5000;
                if (count === 1 && block === 0) return 100;
                if (count === 1 && block === 1) return 500;
                if (count === 0 && block === 0) return 100;

            } else if (selectedWinningLength === 5) {
                if (count >= 4) return 100000;
                if (count === 3 && block === 0) return 5000;
                if (count === 3 && block === 1) return 1000;
                if (count === 2 && block === 0) return 500;
                if (count === 2 && block === 1) return 100;
                if (count === 1 && block === 0) return 50;
                if (count === 1 && block === 1) return 25;
                if (count === 0 && block === 1) return 10;
                if (count === 0 && block === 0) return 5;

            }  else if (selectedWinningLength === 6) {
                if (count >= 4) return 100000;
                if (count === 3 && block === 0) return 5000;
                if (count === 3 && block === 1) return 1000;
                if (count === 2 && block === 0) return 500;
                if (count === 2 && block === 1) return 100;
                if (count === 1 && block === 0) return 50;
                if (count === 1 && block === 1) return 25;
                // if (count === 0 && block === 1) return 10;
                if (count === 0 && block === 0) return 5;
            }
            
            return 0;
        }

        for (let x = 0; x < SIZE; x++) {
            for (let y = 0; y < SIZE; y++) {
                if (board[x][y] === player) {
                    for (let [dx, dy] of directions) {
                        score += countPattern(x, y, dx, dy);

                        console.log(`score : ${score}`)
                    }
                }
            }
        }
        return score;
    }

    function minimax(board, depth, isMax, alpha, beta, player) {
        if (depth === 0) return evaluateBoardPattern(board, player);

        console.log('getCandidateMovesForMinimax() @ minimax() =====')

        const moves = getCandidateMovesForMinimax(board);
        let bestScore = isMax ? -Infinity : Infinity;

        for (let [x, y] of moves) {
            board[x][y] = player;
            const score = minimax(board, depth - 1, !isMax, alpha, beta, 3 - player);
            board[x][y] = EMPTY;

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


    function findBestMoveByMinimax(board, player, bestMoveByEmptySpace) {
        let bestScore = -Infinity;
        let bestMove = null;

        // 중앙 판 기준으로 공간 많은 위치를 막는 방향
        // 검은 돌과 가까운 쪽
        // 대각선에 두는 걸로...

        // 현황 기준으로 돌을 놓을 수 있는 위치 탐색
        for (let [x, y] of getCandidateMovesForMinimax(board)) {
            
            // 플레이어가 x, y 좌표에 돌을 뒀다 치고 점수 계산 후에 클리어
            // draw 를 하지 않으므로 화면에 보이지는 않음
            board[x][y] = player;

            // depth 가 2 이상인 경우에는
            // 각 위치에 돌을 둔 경우, 그 다음 수를 탐색 => minimax() 내에서 그 다음 getCandidateMovesForMinimax() 를 계산
            // minimax 돌린 것 별로 bestScore 가 나옴 : 각 칸마다 뒀을 때 최고 점수 뽑는 듯
            // 성능에 영향 있을 듯?
            const score = minimax(board, depth - 1, false, -Infinity, Infinity, 3 - player);
            
            board[x][y] = EMPTY;
            


            // 전체 loop 를 다 돌고 best 중의 bestScore 를 업데이트?
            // 성능에 영향 있을 듯?

            // 등호가 없는 경우
            // 점수가 같으면 먼저 뽑은 위치가 선정됨 : AI가 항상 왼쪽 위에 두는 이유?
            //
            // 등호가 있으면 항상 오른쪽 아래로 둘 듯

            // to-do
            // 중앙 판 기준으로
            // 공간 많고 검은 돌과 가까운 쪽에 두는 걸로... 
            // => score 외에 다른 항목도 추가해야 됨
            // => minimax 따로, 다른 평가 따로.
            if (score >= bestScore) {

                console.log(`score : ${score}`);

                // score 가 동일하면 공간 넓은 위치로 업데이트
                if (score === bestScore) {
                    if (bestMoveByEmptySpace[0] === x && bestMoveByEmptySpace[1] === y) {
                        bestScore = score;
                        bestMove = [x, y, bestScore];
                    }
                } else {
                    bestScore = score;
                    bestMove = [x, y, bestScore];
                }
            }
        }

        console.log(`bestScore : ${bestScore}`);

        return bestMove || [Math.floor(SIZE / 2), Math.floor(SIZE / 2), 0];
    }

    function findBlockingMove(opponent) {
        const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];

        for (let x = 0; x < SIZE; x++) {
            for (let y = 0; y < SIZE; y++) {

                if (board[x][y] !== EMPTY) continue;

                for (let [dx, dy] of directions) {
                    let count = 0;
                    for (let i = 1; i <= (selectedWinningLength - 1); i++) {
                        const nx = x + dx * i;
                        const ny = y + dy * i;
                        if (nx < 0 || ny < 0 || nx >= SIZE || ny >= SIZE) break;
                        if (board[nx][ny] === opponent) count++;
                        else break;
                    }
                    for (let i = 1; i <= (selectedWinningLength - 1); i++) {
                        const nx = x - dx * i;
                        const ny = y - dy * i;
                        if (nx < 0 || ny < 0 || nx >= SIZE || ny >= SIZE) break;
                        if (board[nx][ny] === opponent) count++;
                        else break;
                    }

                    if (count >= 2) return [x, y, count];

                    // if (count >= (selectedWinningLength - 2)) return [x, y, count];
                }
            }
        }

        return null;
    }


    const opponentStones = getOpponentStones(SIZE, board);
    const bestMoveByEmptySpace = findBestMoveByEmptySpace(SIZE, opponentStones);

    console.log(`bestMoveByEmptySpace : ${bestMoveByEmptySpace}`)

    
    const blockMove = findBlockingMove(1); // 사용자(흑) 차단 우선
    const bestMove = findBestMoveByMinimax(board, player, bestMoveByEmptySpace);
    

    // 내 돌 중 가장 좋은 케이스가 한쪽 막힌 3개 미만이면 수비
    console.log(`blockMove : ${blockMove}`)
    console.log(`bestMove : ${bestMove}`)

    // 100000
    if (blockMove && blockMove[2] === 1) { //  && bestMove[2] < 25
        postMessage(bestMove); // 공격
    } else if (blockMove && blockMove[2] === 2 && bestMove[2] < 100) { //  && bestMove[2] < 100
        postMessage(blockMove); // 방어
    } else if (blockMove && blockMove[2] >= 3 && bestMove[2] < 100000) {
        postMessage(blockMove); // 방어
    } else {
        postMessage(bestMove); // 공격
    }

};