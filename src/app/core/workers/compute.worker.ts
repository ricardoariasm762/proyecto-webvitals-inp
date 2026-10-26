/// <reference lib="webworker" />

addEventListener('message', ({ data }: MessageEvent<{ type?: string; iterations?: number }>) => {
  const iterations = data?.iterations || 5_000_000;
  const startTime = performance.now();

  let primesCount = 0;
  // Algoritmo de cómputo intensivo de CPU para simular carga pesada sin tocar el DOM
  for (let i = 2; i <= iterations; i++) {
    let isPrime = true;
    const limit = Math.floor(Math.sqrt(i));
    for (let j = 2; j <= limit; j++) {
      if (i % j === 0) {
        isPrime = false;
        break;
      }
    }
    if (isPrime) {
      primesCount++;
    }
  }

  const durationMs = performance.now() - startTime;

  postMessage({
    status: 'done',
    durationMs: Number(durationMs.toFixed(2)),
    primesCount
  });
});
