print("LabJack Lua Waveform Generator Example. Version 1.0")
-- This script will output a waveform on DAC0
-- User memory is used to set the scan frequency,
-- wave frequency, wave shape, amplitude and offset.
-- Once the script is running switch to the "Register Matrix" tab and add
-- regsierst 46000, 46002, 46004, 46006, and 46008. See below for which register
-- affects which attribute. Updating those values will update the output wave.

local OStreamBuffSize = 1024      -- number of bytes to allocate to the buffer

local streamScanFreq = 10000      -- How often the DAC's value will be updated
local waveFreq = 100              -- Frequency of the sine wave.
local waveShape = 0               -- 0=sine, 1=square, 2=triangle
local waveAmp = 1.0               -- Wave amplitude
local waveOff = 1.0               -- Wave offset

local last_SSF = 0
local last_WF = 0
local last_WS = 0
local last_WA = 0
local last_WO = 0

-- Initialize IO memeory
MB.W(46000, 3, streamScanFreq)
MB.W(46002, 3, waveFreq)
MB.W(46004, 3, waveShape)
MB.W(46006, 3, waveAmp)
MB.W(46008, 3, waveOff)

MB.W(4090, 1, 0)                  -- Stream out off
MB.W(4040, 1, 1000)               -- Set Stream-Out target to DAC0
MB.W(4050, 1, OStreamBuffSize)    -- Set the buffer size
MB.W(4090, 1, 1)                  -- Stream out on

LJ.IntervalConfig(0, 1000)        -- Check for new values once per second
LJ.IntervalConfig(1, 50)          -- Used to limit debugging output rates
while true do
  if LJ.CheckInterval(0) then

    -- Read IO memory
    streamScanFreq = MB.R(46000, 3)
    waveFreq = MB.R(46002, 3)
    waveShape = MB.R(46004, 3)
    waveAmp = MB.R(46006, 3)
    waveOff = MB.R(46008, 3)
    
    if streamScanFreq ~= last_SSF then  -- If updating streamScanFreq
      if MB.R(4990, 1) ~= 0 then        -- If stream is on  
        MB.W(4990, 1, 0)                -- Disable stream
        print("Updating scan rate")
      end                               -- Always disabling stream is an option, but will throw an error.
    end
    
    if waveFreq ~= last_WF or           -- If new waveform has been specified.
       waveShape ~= last_WS or
       waveAmp ~= last_WA or
       waveOff ~= last_WO then
      
      print("Updating wave")
      print(waveFreq, waveShape, waveAmp, waveOff)
      
      -- Compute new wave
      local nPoints = streamScanFreq / waveFreq
      if nPoints > (OStreamBuffSize / 2) then
        print("Too many points for the buffer specified.")
      end
      local dataSet = {}
      local i = 1
      for i=1, nPoints, 1 do
        if waveShape == 0 then          -- Sine wave
          dataSet[i] = math.sin(6.283185 * i / nPoints)
        elseif waveShape == 1 then      -- Square wave
          if i < (nPoints / 2) then 
            dataSet[i] = -1
          else
            dataSet[i] = 1
          end
        elseif waveShape == 2 then      -- Triangle wave
          local step = 4 / nPoints
          if i < (nPoints / 2) then 
            dataSet[i] = step*i - 1 
          else
            dataSet[i] = 1 - step * (i - nPoints / 2)
          end
        end
        dataSet[i] = dataSet[i] * waveAmp
        dataSet[i] = dataSet[i] + waveOff
        
--        print(i, dataSet[i])                  -- Print out the dataset
--        while LJ.CheckInterval(1) == nil do   -- limit the rate that the debug buffer is filled
--        end
      end
      
       -- Load the new wave form
      for i=1, nPoints, 1 do            -- load all the data... one at a time
        MB.W(4400, 3, dataSet[i])       -- This could imporved to load more quickly
      end                               -- but the benefit will be smaller than when using C-R.
      
      MB.W(4060, 1, nPoints)            -- Set the number of points to loop
      MB.W(4070, 1, 1)                  -- Begin using the recently loaded data set.
    end

    if MB.R(4990, 1, 0) == 0 then       -- If stream is off because this is the first run or changing scanFreq
      MB.W(4002, 3, streamScanFreq)     -- Set scan rate
      MB.W(4004, 1, 1)                  -- 1 Chn per scan
      MB.W(4008, 3, 0)                  -- Automatic Settling
      MB.W(4010, 1, 0)                  -- Automatic Resolution
      MB.W(4012, 1, 256)                -- Use a real small buffer, because we don't care about any data.
      MB.W(4014, 1, 0)                  -- No advanced clocking options
      MB.W(4016, 1, 0)                  -- No advanced targets
      MB.W(4020, 1, 0)                  -- Continuous operation; disable burst.
      MB.W(4100, 1, 4800)               -- Add channel 4800 (StreamOut 0)
      MB.W(4990, 1, 1)                  -- Start stream
    end
    
    last_SSF = streamScanFreq
    last_WF = waveFreq
    last_WS = waveShape
    last_WA = waveAmp
    last_WO = waveOff
  end
end