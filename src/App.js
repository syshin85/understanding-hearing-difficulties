import React, { useEffect, useRef, useState } from "react";
import Scrollama from "scrollama";
import "./App.css";

const App = () => {
  const [step, setStep] = useState(0);
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const [yourTheme, setYourTheme] = useState({ lineColor: "gray" }); // Default theme
  const [visualState, setVisualState] = useState({state:0});
  const [axisState, setAxisState]=useState({state:0});

  const audiogramRef = useRef({
    125: 0, 250: 0, 500: 0, 1000: 0, 2000: 0, 4000: 0, 8000: 0
  });

  const yourAudiogramRef = useRef({
    125: 0, 250: 0, 500: 0, 1000: 0, 2000: 0, 4000: 0, 8000: 0
  });

  const [audiogram, setAudiogram] = useState({
      125: 0, 250: 0, 500: 0, 1000: 0, 2000: 0, 4000: 0, 8000: 0
  });

  const [yourAudiogram, setYourAudiogram] = useState({
    125: 0, 250: 0, 500: 0, 1000: 0, 2000: 0, 4000: 0, 8000: 0
});

  const NH = {
    125: 0, 250: 0, 500: 0, 1000: 0, 2000: 0, 4000: 0, 8000: 0
  };

  const HH = {
    125: 10, 250: 15, 500: 20, 1000: 25, 2000: 35, 4000: 55, 8000: 70
  };

  const CI = {
      125: 90, 250: 75, 500: 60, 1000: 35, 2000: 30, 4000: 35, 8000: 70
  };

  const Deaf = {
    125: 70, 250: 80, 500: 90, 1000: 90, 2000: 95, 4000: 100, 8000: 100
  };

  const [myTheme, setMyTheme] = useState({id: NH, backgroundColor: "white", lineColor: "#644DA5" }); // Default theme

  const handleStepEnter = ({ index }) => {
    setStep(index);
    
    if (index === 0) {
      // Stop visualization and clear canvas
      cancelAnimationFrame(animationFrameRef.current);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
      if (audioRef.current) {
        audioRef.current.pause(); // Pause audio
        audioRef.current.currentTime = 0; // Reset audio to start
      }
    } else if (index === 1) {
      // Restart visualization and audio
      if (audioContextRef.current) {
        visualize(); // Restart the visualization
      } else {
        setupAudioVisualization(); // Set up if not already done
      }
      if (audioRef.current) {
        audioRef.current.play();
      }
    }

    if (index === 0)applyBoost(0);
    else if (index ===1)applyBoost(0);
    else if (index === 2)applyBoost(0);
    else if (index ===3)applyBoost(1);
    else if (index === 4){
      applyBoost(2);
      applyYourAudioProfile(NH,"#644DA5")
    }else if (index === 5 )
    {
      applyBoost(2);
      applyYourAudioProfile(HH,"#3682F2")
    }else if (index === 6 )
    {
      applyBoost(2);
      applyYourAudioProfile(CI,"#73B157")
    }else if (index === 7 )
    {
      applyBoost(2);
      applyYourAudioProfile(Deaf,"#F49A2C")
    }
  };

  const setupAudioVisualization = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;

    const source = audioContext.createMediaElementSource(audioRef.current);
    source.connect(analyser);
    analyser.connect(audioContext.destination);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;

    visualize();
  };

  const applyMyAudioProfile = (profile, bgColor, lineColor) => {
    setMyTheme({ id: profile, backgroundColor: bgColor, lineColor });
    setAudiogram(profile);
    audiogramRef.current = { ...profile };  
  };

  const applyYourAudioProfile = (profile, lineColor) => {
    setYourTheme({ lineColor });
    setYourAudiogram(profile);
    yourAudiogramRef.current = { ...profile };  
  };

  const applyBoost = (state) => {
    setVisualState({ state });
  };

  const getAWeighting = (frequency) => {
    const f = frequency;
    const ra = (Math.pow(12194, 2) * Math.pow(f, 4)) /
        ((Math.pow(f, 2) + Math.pow(20.6, 2)) *
         Math.sqrt((Math.pow(f, 2) + Math.pow(107.7, 2)) * (Math.pow(f, 2) + Math.pow(737.9, 2))) *
         (Math.pow(f, 2) + Math.pow(12194, 2)));
    const aWeighting = 20 * Math.log10(ra) + 2.0;
    return Math.pow(10, aWeighting / 20);
  };

  const frequencyToMel = (frequency) => {
      return 2595 * Math.log10(1 + frequency / 700);
  };

  const melToFrequency = (mel) => {
      return 700 * (Math.pow(10, mel / 2595) - 1);
  };

  const interpolateAudiogram = (frequency) => {
    const freqs = Object.keys(audiogramRef.current).map(Number).sort((a, b) => a - b);
    
    for (let i = 0; i < freqs.length - 1; i++) {
        const f1 = freqs[i];
        const f2 = freqs[i + 1];
        if (frequency >= f1 && frequency <= f2) {
            const val1 = audiogramRef.current[f1];
            const val2 = audiogramRef.current[f2];
            const t = (frequency - f1) / (f2 - f1);
            return val1 * (1 - t) + val2 * t;
        }
    }
    return frequency <= freqs[0]
        ? audiogramRef.current[freqs[0]]
        : audiogramRef.current[freqs[freqs.length - 1]];
  };

  const interpolateYourAudiogram = (frequency) => {
    const freqs = Object.keys(yourAudiogramRef.current).map(Number).sort((a, b) => a - b);
    
    for (let i = 0; i < freqs.length - 1; i++) {
        const f1 = freqs[i];
        const f2 = freqs[i + 1];
        if (frequency >= f1 && frequency <= f2) {
            const val1 = yourAudiogramRef.current[f1];
            const val2 = yourAudiogramRef.current[f2];
            const t = (frequency - f1) / (f2 - f1);
            return val1 * (1 - t) + val2 * t;
        }
    }
    return frequency <= freqs[0]
        ? yourAudiogramRef.current[freqs[0]]
        : yourAudiogramRef.current[freqs[freqs.length - 1]];
  };

  const applyAudiogramCompression = (frequency, amplitude) => {
    const adjustmentDb = interpolateAudiogram(frequency);
    const reductionFactor = 1 - adjustmentDb / 100;

    // Return amplitude adjusted by the audiogram compression only
    return amplitude * reductionFactor;
  };

  const applyYourAudiogramCompression = (frequency, amplitude) => {
    const adjustmentDb = interpolateYourAudiogram(frequency);
    const reductionFactor = 1 - adjustmentDb / 100;

    // Return amplitude adjusted by the audiogram compression only
    return amplitude * reductionFactor;
  };

  const hexToRgba = (hex, alpha = 1) => {
    const bigint = parseInt(hex.replace("#", ""), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const visualize = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const analyser = analyserRef.current;
  
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const sampleRate = audioContextRef.current.sampleRate; // Audio sample rate

    const minFrequency = 20; // Minimum frequency to visualize
    const maxFrequency = 16000; // Maximum frequency to visualize
    const minBin = Math.ceil((minFrequency * bufferLength * 2) / sampleRate); // Min frequency bin
    const maxBin = Math.floor((maxFrequency * bufferLength * 2) / sampleRate); // Max frequency bin
    const minMel = frequencyToMel(minFrequency);
    const maxMel = frequencyToMel(maxFrequency);
      
    let animationProgress=0;

    const draw = () => {
      analyser.getByteFrequencyData(dataArray);
  
      ctx.clearRect(0, 0, canvas.width, canvas.height);

       // Animation progress for axis lines
      const axisAnimationSpeed = 0.02; // Adjust speed (higher is faster)
      animationProgress = Math.min(1, animationProgress + axisAnimationSpeed);
      if(axisState.state==0)setAxisState(1);
      else animationProgress=1;

      // Calculate dynamic min and max amplitudes for normalization
      const MyAmplitudes = [];
      const YourAmplitudes = [];
      for (let i = minBin; i <= maxBin; i++) {
        const frequency = (i * sampleRate) / (2 * bufferLength);
        const aWeightedAmplitude = dataArray[i] * getAWeighting(frequency);
        const audiogramAdjustedAmplitude = applyAudiogramCompression(frequency, aWeightedAmplitude);
        const yourAudiogramAdjustedAmplitude = applyYourAudiogramCompression(frequency, aWeightedAmplitude);
        MyAmplitudes.push(audiogramAdjustedAmplitude);
        YourAmplitudes.push(yourAudiogramAdjustedAmplitude);
      }
      const MyminAmp = Math.min(...MyAmplitudes);
      const MymaxAmp = Math.max(...MyAmplitudes);
      const YourminAmp = Math.min(...YourAmplitudes);
      const YourmaxAmp = Math.max(...YourAmplitudes);

      console.debug(MymaxAmp,MyminAmp);

      // Calculate dynamic line width based on frequencies under 100 Hz for the first line
      let lineWidthUnder100Hz = 2;
      let lineAmplitudeSumUnder100Hz = 0;

      if(visualState.state>0){
        for (let i = 0; i < bufferLength; i++) {
          const frequency = (i * sampleRate) / (2 * bufferLength);
          if (frequency < 100) {
              lineAmplitudeSumUnder100Hz += dataArray[i] *  getAWeighting(frequency);
          }
        }
        lineWidthUnder100Hz = Math.min(100, (lineAmplitudeSumUnder100Hz));
      }

      ctx.beginPath();
      ctx.strokeStyle = myTheme.lineColor;
      ctx.lineWidth = lineWidthUnder100Hz;

      const visibleBins = maxBin - minBin + 1;
  
      for (let i = minBin; i <= maxBin; i++) {
        // Calculate the frequency for this bin
        const frequency = (i * sampleRate) / (2 * bufferLength);
        const melFrequency = frequencyToMel(frequency);
        
        if (melFrequency < minMel || melFrequency > maxMel) continue;

        const melPosition = (melFrequency - minMel) / (maxMel - minMel);
        const x = melPosition * canvas.width;
  
        // Get the A-weighted amplitude
        let originalAmplitude = dataArray[i]; // Normalize amplitude to [0, 1]
        const aWeighting = getAWeighting(frequency);
        const weightedAmplitude = originalAmplitude * aWeighting;
        const adjustedAmplitude = applyAudiogramCompression(frequency, weightedAmplitude);
        const normalAmplitude=((adjustedAmplitude-MyminAmp)/(MymaxAmp-MyminAmp));

        let y = 0 
        if(visualState.state>0) y = canvas.height - normalAmplitude * canvas.height * 0.5;
        else y = canvas.height - (adjustedAmplitude/255) * canvas.height * 0.5;

        if (i === minBin) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      if(visualState.state==2){
        ctx.beginPath();
        ctx.strokeStyle = hexToRgba(yourTheme.lineColor,0.5);
        ctx.lineWidth = lineWidthUnder100Hz;
    
        for (let i = minBin; i <= maxBin; i++) {
          // Calculate the frequency for this bin
          const frequency = (i * sampleRate) / (2 * bufferLength);
          const melFrequency = frequencyToMel(frequency);
          
          if (melFrequency < minMel || melFrequency > maxMel) continue;

          const melPosition = (melFrequency - minMel) / (maxMel - minMel);
          const x = melPosition * canvas.width;
    
          // Get the A-weighted amplitude
          let originalAmplitude = dataArray[i]; // Normalize amplitude to [0, 1]
          const aWeighting = getAWeighting(frequency);
          const weightedAmplitude = originalAmplitude * aWeighting;
          const adjustedAmplitude = applyYourAudiogramCompression(frequency, weightedAmplitude);
          const normalAmplitude=((adjustedAmplitude-YourminAmp)/(YourmaxAmp-YourminAmp));

          let y = 0 
          if(visualState.state>0) y = canvas.height - normalAmplitude * canvas.height * 0.5;
          else y = canvas.height - (adjustedAmplitude/255) * canvas.height* 0.5;

          if (i === minBin) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
        
      }    
      // Draw Y-axis (animated)
      ctx.beginPath();
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 4;
      ctx.moveTo(0, canvas.height); // Start at bottom-left
      ctx.lineTo(0, canvas.height - animationProgress * (canvas.height-100)); // Animate to top
      ctx.stroke();

      // Draw X-axis (animated)
      ctx.beginPath();
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 4;
      ctx.moveTo(0, canvas.height); // Start at bottom-left
      ctx.lineTo(0 + animationProgress * (canvas.width), canvas.height); // Animate to right
      ctx.stroke();

      // Add labels (static)
      if (animationProgress === 1) {
        ctx.fillStyle = "#000";
        ctx.font = "12px MyLocalFont";
        ctx.fillText("Frequency (Hz)", canvas.width - 100, canvas.height - 10); // X-axis label
        ctx.fillText("Amplitude", 10, 100); // Y-axis label
      }

      // Plot the lines (existing logic)
      ctx.beginPath();
      ctx.strokeStyle = myTheme.lineColor;
      ctx.lineWidth = 2;

      animationFrameRef.current = requestAnimationFrame(draw);

    };
  
    draw();
  };
  
// Scrollama setup (runs once)
  useEffect(() => {
    const scroller = Scrollama();

    scroller
      .setup({
        step: ".step",
        offset: 0.5,
      })
      .onStepEnter(handleStepEnter);

    return () => {
      scroller.destroy();
    };
  }, []); // Run only once

  // Visualization logic
  useEffect(() => {
    // Trigger visualization if audio context is set up
    if (audioContextRef.current) {
      visualize();
    }

    return () => {
      // Cleanup animation frame
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [myTheme.lineColor]); // Re-run visualization when line color changes

  useEffect(() => {
    // Trigger visualization if audio context is set up
    if (audioContextRef.current) {
      visualize();
    }

    return () => {
      // Cleanup animation frame
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [visualState.state])

  useEffect(() => {
    // Trigger visualization if audio context is set up
    if (audioContextRef.current) {
      visualize();
    }

    return () => {
      // Cleanup animation frame
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [yourTheme.lineColor])

  useEffect(() => {
    window.scrollTo(0, 0); // Scrolls to the top-left corner of the page
  }, []);

  useEffect(() => {
    const scroller = Scrollama();

    scroller
        .setup({
            step: ".step",
            offset: 0.2, // Trigger when step is 50% inside the viewport
        })
        .onStepEnter(({ index }) => {
            console.log("Step entered:", index);
            setStep(index);
        });

    return () => scroller.destroy();
  }, []);


  return (
    <div className="vertical-scroll">
      <div className="visualization-container sticky">
        <canvas ref={canvasRef} width={600} height={400}></canvas>
      </div>
      <div className="scroll-container" style={{backgroundColor : myTheme.backgroundColor}}>
        {/* Step 1 */}
        <div className={`step ${step === 0 ? "active" : ""}`} id="step-1">
          <div className="title-page">
            <h1>Main Title</h1>
            <h2>Subtitle of the Story</h2>
            <p>By: Sungyong Shin</p>
            <p className="description">
              This is a description of the story. It provides a brief overview
              of what the user will experience as they scroll through this
              interactive content.
            </p>
          </div>
        </div>

        {/* Step 2 with Sticky Canvas */}
        <div className={`step ${step === 1 ? "active" : ""}`} id="step-2">
          <div className="text-container">
            <div className="title-page">
              <h2>Page 1. Play music and visualize</h2>
              <p className="description">
                This is a description of the story. It provides a brief overview of
                what the user will experience as they scroll through this
                interactive content.
              </p>
            </div>
          </div>
          <audio ref={audioRef} src="/funk.mp3" loop />
        </div>

        {/* Step 3 with Buttons */}
        <div className={`step ${step === 2 ? "active" : ""}`} id="step-3">
          <div className="text-container">
            <div className="title-page">
              <h2>Page 2. Choose your hearing</h2>
              <p className="description">
                This is a description of the story. It provides a brief overview of
                what the user will experience as they scroll through this
                interactive content.
              </p>
              <button onClick={() => applyMyAudioProfile(NH,"#D8D2EA", "#644DA5")}
                style={{
                  backgroundColor: '#644DA5', 
                  color: 'White',
                  fontFamily: 'MyLocalFont',
                  fontSize: '16px',
                  border: '0px white', 
                  padding: '10px 20px',
                  margin: '5px',
                  cursor: 'pointer',
                  borderRadius: "12px",
              }}>
                No hearing disabilities
              </button>
              <button onClick={() => applyMyAudioProfile(HH, "#D0E2FC", "#3682F2")}
              style={{
                backgroundColor: '#3682F2', 
                color: 'White',
                fontFamily: 'MyLocalFont',
                fontSize: '16px',
                border: '0px white', 
                padding: '10px 20px',
                margin: '5px',
                cursor: 'pointer',
                borderRadius: "12px",
              }}>
                Hard of Hearing
              </button>
              <button onClick={() => applyMyAudioProfile(CI, "#D9EAD2", "#73B157")}
              style={{
                backgroundColor: '#73B157', 
                color: 'White',
                fontFamily: 'MyLocalFont',
                fontSize: '16px',
                border: '0px white', 
                padding: '10px 20px',
                margin: '5px',
                cursor: 'pointer',
                borderRadius: "12px",
              }}>
                Cochlear Implant Users
              </button>
              <button onClick={() => applyMyAudioProfile(Deaf, "#F1D4B1", "#F49A2C")}
              style={{
                backgroundColor: '#F49A2C', 
                color: 'White',
                fontFamily: 'MyLocalFont',
                fontSize: '16px',
                border: '0px white', 
                padding: '10px 20px',
                margin: '5px',
                cursor: 'pointer',
                borderRadius: "12px",
              }}>              
                Deaf
              </button>
            </div>
          </div>
        </div>

        {/* Step 4 with Boosted Visualization */}
        <div className={`step ${step === 3 ? "active" : ""}`} id="step-4">
          <div className="text-container">
            <div className="title-page">
              <h2>Boost visualization</h2>
              <p className="description">
                This is a description of the story. It provides a brief overview of
                what the user will experience as they scroll through this
                interactive content.
              </p>
            </div>
          </div>
        </div>
        {/* Step 5 compare with NH */}
        <div className={`step ${step === 4 ? "active" : ""}`} id="step-5">
          <div className="text-container">
            <div className="title-page">
              <h2>Compare with <span style={{color:"#644DA5"}}>No Hearing Disabilities</span></h2>
              <p className="description">
                This is a description of the story. It provides a brief overview of
                what the user will experience as they scroll through this
                interactive content.
              </p>
            </div>
          </div>
        </div>
      

        {/* Step 5 compare with HH */}
        <div className={`step ${step === 5 ? "active" : ""}`} id="step-6">
          <div className="text-container">
            <div className="title-page">
              <h2>Compare with <span style={{color:"#3682F2"}}>Hard of Hearing</span></h2>
              <p className="description">
                This is a description of the story. It provides a brief overview of
                what the user will experience as they scroll through this
                interactive content.
              </p>
            </div>
          </div>
        </div>
        {/* Step 5 compare with CI */}
        <div className={`step ${step === 6 ? "active" : ""}`} id="step-7">
          <div className="text-container">
            <div className="title-page">
              <h2>Compare with <span style={{color:"#73B157"}}>Cochler Implant Users</span></h2>
              <p className="description">
                This is a description of the story. It provides a brief overview of
                what the user will experience as they scroll through this
                interactive content.
              </p>
            </div>
          </div>
        </div>
        {/* Step 5 compare with HH */}
        <div className={`step ${step === 7 ? "active" : ""}`} id="step-8">
          <div className="text-container">
            <div className="title-page">
              <h2>Compare with the <span style={{color:"#F49A2C"}}>Deaf</span></h2>
              <p className="description">
                This is a description of the story. It provides a brief overview of
                what the user will experience as they scroll through this
                interactive content.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default App;
