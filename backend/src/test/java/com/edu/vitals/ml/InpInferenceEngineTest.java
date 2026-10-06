package com.edu.vitals.ml;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class InpInferenceEngineTest {

    private InpInferenceEngine engine;

    @BeforeEach
    void setUp() {
        engine = new InpInferenceEngine();
        ReflectionTestUtils.setField(engine, "modelPath", "models/model_inp_predictor.onnx");
        engine.init();
    }

    @AfterEach
    void tearDown() {
        engine.cleanup();
    }

    @Test
    void testInferenceWithTestVector() {
        // Vector de prueba: [long_task: 120ms, blocking: 95ms, dom_nodes: 2500, lag: 45ms]
        float predictedInp = engine.predictInp(120.0f, 95.0f, 2500.0f, 45.0f);

        System.out.println("Predicted INP: " + predictedInp + " ms");
        assertTrue(predictedInp > 0.0f, "Predicted INP should be positive");
        assertFalse(Float.isNaN(predictedInp), "Predicted INP should not be NaN");
    }

    @Test
    void testLowLatencyVector() {
        // Vector ligero
        float predictedInp = engine.predictInp(10.0f, 5.0f, 400.0f, 2.0f);

        System.out.println("Low latency predicted INP: " + predictedInp + " ms");
        assertTrue(predictedInp < 200.0f, "Low workload should yield Good INP (<200ms)");
    }
}
