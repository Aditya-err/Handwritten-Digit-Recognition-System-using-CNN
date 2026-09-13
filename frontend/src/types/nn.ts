/**
 * TypeScript types for the Neural Network Visualizer.
 * Phase 1: Core types only. Extended in later phases.
 */

// ---------------------------------------------------------------------------
// Health / API
// ---------------------------------------------------------------------------
export interface HealthResponse {
  status: string;
  version: string;
  message: string;
  backend: string;
  models_loaded: {
    numpy_nn: boolean;
    pytorch_cnn: boolean;
  };
}

export interface ApiError {
  error: string;
  detail?: string;
}

// ---------------------------------------------------------------------------
// Neural network architecture
// ---------------------------------------------------------------------------
export type ActivationFunction = 'relu' | 'sigmoid' | 'tanh' | 'softmax' | 'linear';

export interface LayerConfig {
  id: string;
  name: string;
  neurons: number;
  activation: ActivationFunction;
}

export interface NetworkArchitecture {
  layers: LayerConfig[];
  input_size: number;
  output_size: number;
}

// ---------------------------------------------------------------------------
// Prediction (Phase 4+)
// ---------------------------------------------------------------------------
export interface PredictionResult {
  prediction: number;
  probabilities: number[];           // length 10
  layer_activations: LayerActivation[];
  processed_image_b64?: string;      // 28×28 thumbnail as base64 PNG
  intermediate_states?: Record<string, number[]>;
}

export interface LayerActivation {
  layer_name: string;
  layer_index: number;
  activations: number[];
  pre_activations: number[];         // z values before activation fn
}

// ---------------------------------------------------------------------------
// Training (Phase 8+)
// ---------------------------------------------------------------------------
export interface TrainingConfig {
  model: 'numpy_nn';                 // Phase 10 adds 'pytorch_cnn'
  epochs: number;
  batch_size: number;
  learning_rate: number;
  dataset_size: number | 'full';     // 'full' = 60000
  optimizer: 'sgd' | 'adam';
}

export interface TrainHistoryEpoch {
  epoch: number;
  loss: number;
  accuracy: number;
  val_loss: number | null;
  val_accuracy: number | null;
}

export interface TrainStatusResponse {
  status: 'idle' | 'training' | 'completed' | 'failed';
  epoch: number;
  total_epochs: number;
  batch: number;
  total_batches: number;
  loss: number;
  accuracy: number;
  val_loss: number | null;
  val_accuracy: number | null;
  error: string | null;
  history: TrainHistoryEpoch[];
}

// ---------------------------------------------------------------------------
// Neuron inspector (Phase 6+)
// ---------------------------------------------------------------------------
export interface NeuronDetail {
  neuron_id: number;
  layer_name: string;
  layer_index: number;
  activation_value: number;
  pre_activation_value: number;
  bias: number;
  activation_function: ActivationFunction;
  incoming_weights: number[];
  outgoing_weights: number[];
}

// ---------------------------------------------------------------------------
// App navigation
// ---------------------------------------------------------------------------
export type AppTab = 'recognize' | 'compare' | 'cnn' | 'network' | 'training' | 'dataset' | 'learn';

export type Theme = 'dark' | 'light';
