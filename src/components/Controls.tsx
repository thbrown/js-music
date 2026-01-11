import { useState, useEffect } from 'react';
import './Controls.css';
import { ControlsProps, Settings } from '../types';

interface ExtendedControlsProps extends ControlsProps {
  resetTrigger?: number;
}

const Controls: React.FC<ExtendedControlsProps> = ({ onControlChange, resetTrigger }) => {
  // Default values for settings
  const defaultOffset = 0;
  const defaultTempo = 100;
  const defaultOscillatorType = 'sine';
  
  // Use offset instead of direct frequency (0 offset = 440Hz)
  const [offset, setOffset] = useState<number>(defaultOffset);
  const [tempo, setTempo] = useState<number>(defaultTempo);
  const [oscillatorType, setOscillatorType] = useState<string>(defaultOscillatorType);

  // Reset when resetTrigger changes
  useEffect(() => {
    if (resetTrigger !== undefined && resetTrigger > 0) {
      setOffset(defaultOffset);
      setTempo(defaultTempo);
      setOscillatorType(defaultOscillatorType);
      if (onControlChange) {
        const frequency = 440 + defaultOffset;
        onControlChange({ frequency, tempo: defaultTempo, oscillatorType: defaultOscillatorType });
      }
    }
  }, [resetTrigger]);

  // Handle offset change
  const handleOffsetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newOffset = parseInt(e.target.value, 10);
    setOffset(newOffset);
    if (onControlChange) {
      // Convert offset to frequency (base 440Hz + offset)
      const frequency = 440 + newOffset;
      onControlChange({ frequency, tempo, oscillatorType });
    }
  };

  // Handle tempo change
  const handleTempoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTempo = parseInt(e.target.value, 10);
    setTempo(newTempo);
    if (onControlChange) {
      // Convert offset to frequency (base 440Hz + offset)
      const frequency = 440 + offset;
      onControlChange({ frequency, tempo: newTempo, oscillatorType });
    }
  };

  // Handle oscillator type change
  const handleOscillatorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newOscillatorType = e.target.value;
    setOscillatorType(newOscillatorType);
    if (onControlChange) {
      // Convert offset to frequency (base 440Hz + offset)
      const frequency = 440 + offset;
      onControlChange({ frequency, tempo, oscillatorType: newOscillatorType });
    }
  };
  
  // Reset all settings to default values
  const handleResetSettings = () => {
    setOffset(defaultOffset);
    setTempo(defaultTempo);
    setOscillatorType(defaultOscillatorType);
    if (onControlChange) {
      // Convert offset to frequency (base 440Hz + offset)
      const frequency = 440 + defaultOffset;
      onControlChange({ frequency, tempo: defaultTempo, oscillatorType: defaultOscillatorType });
    }
  };

  return (
    <div className="oscillator-controls">
      <h3>Sound Settings</h3>
      
      <div className="control-row">
        <span className="control-label">Offset:</span>
        <input 
          id="offsetInput" 
          type="number" 
          value={offset} 
          onChange={handleOffsetChange}
          title="Frequency offset from 440Hz (middle C)"
        /> 
        <span>Hz</span>
      </div>
      
      <div className="control-row">
        <span className="control-label">Tempo:</span>
        <input 
          id="tempoInput" 
          type="number" 
          value={tempo} 
          onChange={handleTempoChange}
          title="Tempo in beats per minute"
        /> 
        <span>BPM</span>
      </div>
      
      <div className="control-row">
        <span className="control-label">Oscillator:</span>
        <div className="oscillator-types">
          <label className="oscillator-type-label">
            <input 
              type="radio" 
              name="wave" 
              value="sine" 
              checked={oscillatorType === 'sine'} 
              onChange={handleOscillatorChange}
            /> 
            Sine
          </label>
          
          <label className="oscillator-type-label">
            <input 
              type="radio" 
              name="wave" 
              value="square" 
              checked={oscillatorType === 'square'} 
              onChange={handleOscillatorChange}
            /> 
            Square
          </label>
          
          <label className="oscillator-type-label">
            <input 
              type="radio" 
              name="wave" 
              value="sawtooth" 
              checked={oscillatorType === 'sawtooth'} 
              onChange={handleOscillatorChange}
            /> 
            Sawtooth
          </label>
          
          <label className="oscillator-type-label">
            <input 
              type="radio" 
              name="wave" 
              value="triangle" 
              checked={oscillatorType === 'triangle'} 
              onChange={handleOscillatorChange}
            /> 
            Triangle
          </label>
        </div>
      </div>
      
      <div className="control-row">
        <button 
          className="reset-settings-button" 
          onClick={handleResetSettings}
          title="Reset all sound settings to default values"
        >
          Reset Settings
        </button>
      </div>      
    </div>
  );
};

export default Controls;
