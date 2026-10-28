@echo off
set "JAVA_HOME=C:\Program Files\Microsoft\jdk-17.0.20.8-hotspot"
set "PATH=%JAVA_HOME%\bin;%PATH%"
set "SDKMANAGER=C:\Users\21779\AppData\Local\Android\Sdk\cmdline-tools\latest\bin\sdkmanager.bat"

(
  echo y
  echo y
  echo y
  echo y
  echo y
  echo y
  echo y
  echo y
  echo y
  echo y
) > "%TEMP%\y_input.txt"

echo Accepting Android SDK licenses...
"%SDKMANAGER%" --licenses --sdk_root=C:\Users\21779\AppData\Local\Android\Sdk < "%TEMP%\y_input.txt"

echo Installing platform-tools, platforms;android-34, build-tools;34.0.0...
"%SDKMANAGER%" --sdk_root=C:\Users\21779\AppData\Local\Android\Sdk "platform-tools" "platforms;android-34" "build-tools;34.0.0" < "%TEMP%\y_input.txt"

echo All Android SDK components installed successfully!
