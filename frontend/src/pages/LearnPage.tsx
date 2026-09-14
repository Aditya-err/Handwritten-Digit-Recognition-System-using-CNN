import { BookOpen, ArrowRight, Lightbulb, AlertTriangle, MessageSquare } from 'lucide-react';
import type { AppTab } from '../types/nn';

interface LearnPageProps {
  onNavigate: (tab: AppTab) => void;
}

const ROADMAP = [
  { id: 'mnist', title: '1. MNIST & Data' },
  { id: 'images', title: '2. Images as Numbers' },
  { id: 'nn', title: '3. Neural Networks' },
  { id: 'dense', title: '4. Dense Layers' },
  { id: 'activation', title: '5. Activation Functions' },
  { id: 'softmax', title: '6. Softmax' },
  { id: 'loss', title: '7. Loss Functions' },
  { id: 'forward', title: '8. Forward Propagation' },
  { id: 'backprop', title: '9. Backpropagation' },
  { id: 'gradients', title: '10. Gradients' },
  { id: 'gradient-descent', title: '11. Gradient Descent' },
  { id: 'training', title: '12. Training' },
  { id: 'cnn', title: '13. CNNs' },
  { id: 'evaluation', title: '14. Model Evaluation' },
];

interface LearnCardProps {
  id: string;
  title: string;
  definition: React.ReactNode;
  why: React.ReactNode;
  how: React.ReactNode;
  formula?: React.ReactNode;
  example?: React.ReactNode;
  mistake?: React.ReactNode;
  interview?: React.ReactNode;
  appLink?: { label: string; tab: AppTab };
  onNavigate: (tab: AppTab) => void;
}

function LearnCard({ id, title, definition, why, how, formula, example, mistake, interview, appLink, onNavigate }: LearnCardProps) {
  return (
    <div id={id} className="card scroll-mt-24 space-y-4">
      <h2 className="text-2xl font-bold border-b border-[var(--border-color)] pb-2">{title}</h2>
      
      <div className="space-y-4 text-sm leading-relaxed text-[var(--text-secondary)]">
        <div>
          <strong className="text-[var(--text-primary)]">What is it?</strong>
          <p>{definition}</p>
        </div>
        
        <div>
          <strong className="text-[var(--text-primary)]">Why it matters:</strong>
          <p>{why}</p>
        </div>
        
        <div>
          <strong className="text-[var(--text-primary)]">How it works:</strong>
          <div className="mt-1">{how}</div>
        </div>

        {formula && (
          <div className="bg-black/5 dark:bg-white/5 p-4 rounded-lg font-mono text-center border border-[var(--border-color)]">
            {formula}
          </div>
        )}

        {example && (
          <div>
            <strong className="text-[var(--text-primary)] flex items-center gap-1"><Lightbulb size={16} className="text-amber-500"/> Example:</strong>
            <div className="mt-1 bg-black/5 dark:bg-black/20 p-3 rounded-lg border border-[var(--border-color)]">
              {example}
            </div>
          </div>
        )}

        {appLink && (
          <div className="pt-2">
            <button 
              onClick={() => onNavigate(appLink.tab)}
              className="btn-primary inline-flex items-center gap-2 text-sm"
            >
              Explore {appLink.label} <ArrowRight size={16} />
            </button>
          </div>
        )}

        {(mistake || interview) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 mt-4 border-t border-[var(--border-color)]">
            {mistake && (
              <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-red-500">
                <strong className="flex items-center gap-1 mb-1"><AlertTriangle size={16}/> Common Mistake</strong>
                <p className="text-xs">{mistake}</p>
              </div>
            )}
            {interview && (
              <div className="bg-brand-500/10 border border-brand-500/20 p-3 rounded-lg text-brand-400">
                <strong className="flex items-center gap-1 mb-1"><MessageSquare size={16}/> Interview Question</strong>
                <p className="text-xs italic">"{interview}"</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function LearnPage({ onNavigate }: LearnPageProps) {
  // Smooth scroll handler
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-10 py-6">
      
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500/20">
          <BookOpen size={32} className="text-brand-400" />
        </div>
        <h1 className="text-4xl font-bold text-gradient">Learn Machine Learning</h1>
        <p className="text-[var(--text-secondary)] max-w-2xl mx-auto text-lg">
          Learn each concept here and immediately see it in action in the interactive visualizers.
        </p>
      </div>

      {/* Roadmap */}
      <div className="card bg-brand-500/5 border-brand-500/20">
        <h2 className="text-lg font-bold mb-4 border-b border-brand-500/20 pb-2">Learning Roadmap</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {ROADMAP.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className="text-left px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5 rounded transition-colors"
            >
              {item.title}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-8">
        <LearnCard 
          id="mnist"
          title="1. MNIST & Data"
          definition="MNIST (Modified National Institute of Standards and Technology database) is a large collection of handwritten digits commonly used for training image processing systems."
          why="It is the 'Hello World' of machine learning. It provides a simple, standardized way to test new algorithms before applying them to complex real-world data."
          how={
            <ul className="list-disc pl-5 space-y-1">
              <li>Contains 70,000 grayscale images of digits 0-9.</li>
              <li>Split into 60,000 training images and 10,000 testing images.</li>
              <li>Every image is exactly 28×28 pixels in size.</li>
            </ul>
          }
          appLink={{ label: 'Dataset', tab: 'dataset' }}
          mistake="Confusing the Training set with the Test set. You must never train on the Test set, or your model will 'cheat' by memorizing the answers!"
          interview="What is a Train/Test split and why is it necessary?"
          onNavigate={onNavigate}
        />

        <LearnCard 
          id="images"
          title="2. Images as Numbers"
          definition="Computers cannot 'see' images. They only process matrices of numbers. A grayscale image is just a grid of pixel intensity values."
          why="Neural networks require numeric input arrays. We must translate visual data into a mathematical format."
          how={
            <div className="space-y-2">
              <p>In our application, a 28×28 image contains 784 pixels. Each pixel has an intensity value. We normalize these values from 0-255 (raw) to 0.0-1.0 (where 0 is black and 1 is max brightness).</p>
              <div className="flex flex-col sm:flex-row items-center gap-2 font-mono text-xs justify-center p-4">
                <div className="border border-[var(--border-color)] p-2 rounded">28×28 Image</div>
                <ArrowRight size={14}/>
                <div className="border border-[var(--border-color)] p-2 rounded text-brand-400">Flatten()</div>
                <ArrowRight size={14}/>
                <div className="border border-[var(--border-color)] p-2 rounded">784-element 1D Vector</div>
              </div>
            </div>
          }
          appLink={{ label: 'Dataset Pixel Grid', tab: 'dataset' }}
          mistake="Forgetting to normalize image inputs. Neural networks train much faster when input numbers are small (e.g. 0 to 1) rather than large (0 to 255)."
          interview="How does a Dense neural network process a 2D image?"
          onNavigate={onNavigate}
        />

        <LearnCard 
          id="nn"
          title="3. Neural Networks"
          definition="A machine learning model inspired by biological brains, consisting of interconnected layers of artificial 'neurons' (or nodes) that learn to recognize patterns."
          why="They are capable of universal approximation—meaning they can theoretically learn any mathematical function mapping inputs to outputs."
          how={
            <div className="space-y-2">
              <p>Our specific architecture is a Multi-Layer Perceptron (MLP) built from Dense layers:</p>
              <div className="flex flex-col md:flex-row items-center justify-center gap-2 p-2 font-mono text-sm">
                <div className="bg-zinc-800 text-white p-2 rounded">Input (784)</div>
                <ArrowRight size={14}/>
                <div className="bg-brand-600 text-white p-2 rounded">Hidden 1 (128)</div>
                <ArrowRight size={14}/>
                <div className="bg-brand-600 text-white p-2 rounded">Hidden 2 (64)</div>
                <ArrowRight size={14}/>
                <div className="bg-amber-600 text-white p-2 rounded">Output (10)</div>
              </div>
              <p>Every connection between two neurons has a learnable 'weight'. The network 'learns' by slowly adjusting these weights until it predicts digits correctly.</p>
            </div>
          }
          appLink={{ label: 'Network Visualizer', tab: 'network' }}
          mistake="Assuming more layers always means a better model. Too many layers can lead to overfitting or vanishing gradients."
          interview="What is a hidden layer?"
          onNavigate={onNavigate}
        />

        <LearnCard 
          id="dense"
          title="4. Dense Layers"
          definition="A layer where every neuron is connected to every neuron in the previous layer. Also known as a Fully Connected layer."
          why="They allow the network to combine different features learned in the previous layer to form higher-level understanding."
          how="A single neuron calculates a weighted sum of all its inputs, adds a bias term, and outputs a single 'pre-activation' number."
          formula="z = (w₁x₁ + w₂x₂ + ... + wₙxₙ) + b"
          example={
            <div className="font-mono text-xs space-y-1">
              <div>Inputs: x = [2, 3]</div>
              <div>Weights: w = [0.5, 0.2]</div>
              <div>Bias: b = 1</div>
              <div className="pt-2 text-brand-400">z = (2 × 0.5) + (3 × 0.2) + 1</div>
              <div className="text-brand-400">z = 1.0 + 0.6 + 1 = 2.6</div>
            </div>
          }
          appLink={{ label: 'Neuron Inspector', tab: 'network' }}
          mistake="Forgetting the bias term! Without a bias, the activation line must pass through the origin (0,0), strictly limiting what the neuron can learn."
          interview="What is the difference between a weight and a bias?"
          onNavigate={onNavigate}
        />

        <LearnCard 
          id="activation"
          title="5. Activation Functions (ReLU)"
          definition="Mathematical functions applied to a neuron's output. ReLU (Rectified Linear Unit) is the most common."
          why="Without activation functions, a neural network, no matter how many layers deep, would just be one giant linear equation. Activations introduce non-linearity, allowing the network to learn complex curves."
          how="ReLU simply returns the input if it's positive, and returns 0 if it's negative."
          formula="ReLU(x) = max(0, x)"
          example={
            <pre className="text-xs">
{`def relu(x):
    return np.maximum(0, x)

# ReLU(2.6) = 2.6
# ReLU(-1.5) = 0`}
            </pre>
          }
          mistake="The 'Dying ReLU' problem. If a neuron's weights update such that it always outputs negative numbers, ReLU will always output 0. The neuron's gradient becomes 0, and it permanently stops learning."
          interview="Why do we need non-linear activation functions?"
          onNavigate={onNavigate}
        />

        <LearnCard 
          id="softmax"
          title="6. Softmax"
          definition="An activation function used in the final Output Layer for multi-class classification."
          why="The network's final layer outputs arbitrary raw scores (logits). Softmax converts these scores into a beautiful probability distribution."
          how="It exponentiates each score (making them all positive) and divides by the sum of all exponentials (so they sum exactly to 1.0 or 100%)."
          formula="P(y_i) = exp(z_i) / Σ exp(z_j)"
          example={
            <pre className="text-xs">
{`def softmax(z):
    exp_z = np.exp(z - np.max(z)) # max subtraction for numerical stability
    return exp_z / np.sum(exp_z)

# Scores: [2.0, 1.0, 0.1]
# Probabilities: [0.659, 0.242, 0.098] -> Sums to 1.0!`}
            </pre>
          }
          appLink={{ label: 'Probabilities', tab: 'recognize' }}
          mistake="Confusing logits with probabilities. A logit of 2.0 does not mean 200% confidence!"
          interview="What does Softmax do to the output layer?"
          onNavigate={onNavigate}
        />

        <LearnCard 
          id="loss"
          title="7. Cross-Entropy Loss"
          definition="A mathematical function that measures how 'wrong' the model's predicted probabilities are compared to the true label."
          why="The network needs a single number to represent its error so it can minimize it. 'Accuracy' is too rigid (a step function); Loss is smooth and differentiable."
          how="Categorical Cross-Entropy heavily penalizes the model if it assigns a very low probability to the correct answer."
          formula="L = -log(P_target)"
          example={
            <div className="font-mono text-xs space-y-1">
              <div>If true digit is '7', and model predicted P(7) = 0.90:</div>
              <div className="text-green-500">Loss = -log(0.9) ≈ 0.105 (Low loss)</div>
              <div className="mt-2">If model predicted P(7) = 0.10:</div>
              <div className="text-red-500">Loss = -log(0.1) ≈ 2.302 (High loss)</div>
            </div>
          }
          appLink={{ label: 'Loss Calculation', tab: 'backprop' }}
          mistake="Thinking Loss and Accuracy are the same thing. Loss drives the training updates; Accuracy is just a human-readable metric."
          interview="Why do we use Cross-Entropy Loss instead of Accuracy to train classification models?"
          onNavigate={onNavigate}
        />

        <LearnCard 
          id="forward"
          title="8. Forward Propagation"
          definition="The process of passing input data through the neural network layers from start to finish to generate a prediction."
          why="It is how the model makes decisions. During training, it's the first step before calculating loss and doing backpropagation."
          how={
            <div className="text-xs space-y-2 font-mono">
              <div>1. input → Dense1 → z1 → ReLU → a1</div>
              <div>2. a1 → Dense2 → z2 → ReLU → a2</div>
              <div>3. a2 → Dense3 → z3 → Softmax → predictions</div>
            </div>
          }
          appLink={{ label: 'Forward Pass Flow', tab: 'network' }}
          mistake="Thinking a single forward pass trains the model. Forward propagation only 'guesses' the answer; it does not update weights."
          interview="Describe the steps of Forward Propagation."
          onNavigate={onNavigate}
        />

        <LearnCard 
          id="backprop"
          title="9. Backpropagation"
          definition="An algorithm that calculates the gradient (derivative) of the Loss function with respect to every single weight and bias in the network."
          why="It tells the network exactly how much 'blame' each parameter deserves for the final error, by systematically applying the Calculus Chain Rule backwards."
          how={
            <div className="space-y-2">
              <p>It starts at the output loss and flows backward. The most beautiful property is the gradient at the output layer (Softmax + Cross Entropy combined):</p>
            </div>
          }
          formula="∂L / ∂z = (Prediction - Target)"
          example={
            <div className="font-mono text-xs space-y-1">
              <div>Prediction for digit 3 is 0.8 (80%)</div>
              <div>Target for digit 3 is 1.0 (True)</div>
              <div className="text-brand-400">Gradient = 0.8 - 1.0 = -0.2</div>
              <div className="mt-1 italic">Meaning: we need to increase the pre-activation to decrease the error!</div>
            </div>
          }
          appLink={{ label: 'Backprop UI', tab: 'backprop' }}
          mistake="Describing it as 'the network learning backwards'. It's strictly just the calculation of partial derivatives (gradients)."
          interview="What is the Chain Rule, and how does Backpropagation use it?"
          onNavigate={onNavigate}
        />

        <LearnCard 
          id="gradients"
          title="10. Gradients"
          definition="A vector of partial derivatives. A gradient tells us the direction and magnitude of change in loss with respect to a parameter."
          why="Without gradients, the network would have to guess randomly to find better weights. Gradients provide a strict mathematical compass pointing towards a lower loss."
          how={
            <ul className="list-disc pl-5 space-y-1 text-xs mt-2">
              <li><strong className="text-red-400">Positive Gradient:</strong> Increasing the weight increases the loss (bad). We must decrease the weight.</li>
              <li><strong className="text-blue-400">Negative Gradient:</strong> Increasing the weight decreases the loss (good). We must increase the weight.</li>
              <li><strong>Zero Gradient:</strong> The weight is at a local optimum (or trapped in a dying ReLU).</li>
            </ul>
          }
          appLink={{ label: 'Gradient Heatmaps', tab: 'backprop' }}
          mistake="Assuming a gradient tells you the global absolute minimum. It only tells you the slope at your current exact position (a local compass)."
          interview="What does a positive gradient mean for a weight?"
          onNavigate={onNavigate}
        />

        <LearnCard 
          id="gradient-descent"
          title="11. Gradient Descent"
          definition="The optimization algorithm used to update the weights based on the gradients computed by backpropagation."
          why="This is the actual 'learning' step! Backprop just finds the gradients; Gradient Descent actually changes the parameters."
          how="We subtract a small fraction (learning rate η) of the gradient from the old weight."
          formula="W_new = W_old - (η × Gradient)"
          example={
            <div className="font-mono text-xs space-y-1">
              <div>W_old = 0.50</div>
              <div>Gradient = 0.20</div>
              <div>Learning Rate (η) = 0.10</div>
              <div className="pt-2 text-brand-400">W_new = 0.50 - (0.10 × 0.20)</div>
              <div className="text-brand-400">W_new = 0.50 - 0.02 = 0.48</div>
            </div>
          }
          appLink={{ label: 'Weight Update Simulator', tab: 'backprop' }}
          mistake="Setting the Learning Rate too high. If η is huge, the weight update overshoots the minimum and the loss explodes."
          interview="What is a learning rate, and what happens if it's too large?"
          onNavigate={onNavigate}
        />

        <LearnCard 
          id="training"
          title="12. Training"
          definition="The repetitive cycle of looping through the entire dataset to optimize the model parameters."
          why="A single image isn't enough to learn. The network must see tens of thousands of variations, thousands of times, to generalize."
          how={
            <ul className="list-disc pl-5 space-y-1 text-xs mt-2">
              <li><strong>Batch:</strong> Processing a small subset of images (e.g. 32) at once to average out noisy gradients before updating weights.</li>
              <li><strong>Epoch:</strong> One complete pass through the entire dataset (e.g. all 60,000 images).</li>
            </ul>
          }
          appLink={{ label: 'Training Dashboard', tab: 'training' }}
          mistake="Training on the entire 60,000 images before doing a single weight update (Full Batch Gradient Descent). This is terribly slow. Mini-batches (e.g., 32 or 64) are much more efficient."
          interview="What is the difference between an Epoch and a Batch?"
          onNavigate={onNavigate}
        />

        <LearnCard 
          id="cnn"
          title="13. Convolutional Neural Networks (CNN)"
          definition="A specialized neural network architecture designed for grid-like data, such as images, using spatial sliding filters (convolutions)."
          why="Dense layers flatten images, destroying 2D spatial relationships. CNNs preserve the 2D structure, allowing them to detect edges, corners, and shapes regardless of where they appear in the image (Translation Invariance)."
          how={
            <div className="text-xs space-y-2">
              <p>The CNN architecture implemented in Phase 6 of this project:</p>
              <div className="font-mono text-[var(--text-primary)]">
                1. Conv1 (1 → 8 filters, 3×3)<br/>
                2. ReLU + MaxPool (2×2)<br/>
                3. Conv2 (8 → 16 filters, 3×3)<br/>
                4. ReLU + MaxPool (2×2)<br/>
                5. Flatten<br/>
                6. Linear Dense (16×7×7 → 10)<br/>
              </div>
            </div>
          }
          appLink={{ label: 'CNN Feature Maps', tab: 'cnn' }}
          mistake="Assuming CNN feature maps are always human-readable. Early layers often look like edge detectors, but deeper layers become abstract mathematical representations."
          interview="Why is a CNN better than a Dense MLP for image recognition?"
          onNavigate={onNavigate}
        />

        <LearnCard 
          id="evaluation"
          title="14. Model Evaluation"
          definition="Testing the fully trained model on the unseen Test Dataset to measure its true, generalized accuracy."
          why="If a model just memorizes the training data, it has 100% Training Accuracy but fails miserably in the real world. This is called Overfitting."
          how="We calculate Accuracy = (Correct Predictions / Total Predictions). We can also use a Confusion Matrix to see which digits the model frequently confuses (e.g., confusing 4s with 9s)."
          mistake="Tuning your model hyperparameters (like layer sizes) based on Test Set accuracy. This secretly leaks test information into the model design. You should use a separate Validation Set for tuning."
          interview="What is overfitting and how do you detect it?"
          onNavigate={onNavigate}
        />

      </div>
    </div>
  );
}
