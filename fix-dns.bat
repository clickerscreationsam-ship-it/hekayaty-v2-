@echo off
echo ================================================
echo    Quick DNS Fix for Supabase Connection
echo ================================================
echo.
echo This will set your DNS to Google DNS (8.8.8.8)
echo.
pause

echo.
echo [1/3] Finding active network adapter...
netsh interface show interface

echo.
echo [2/3] Setting DNS to Google DNS...
echo.
echo Please type your network adapter name from the list above.
echo Common names: "Wi-Fi", "Ethernet", "Local Area Connection"
echo.
set /p adapter="Enter adapter name: "

echo.
echo Setting DNS for: %adapter%
netsh interface ipv4 set dns name="%adapter%" static 8.8.8.8 primary
netsh interface ipv4 add dns name="%adapter%" 8.8.4.4 index=2

echo.
echo [3/3] Flushing DNS cache...
ipconfig /flushdns
ipconfig /registerdns

echo.
echo ================================================
echo    DNS Configuration Complete!
echo ================================================
echo.
echo Testing Supabase connection...
ping -n 4 stbwxgnjzmmnjgdrkwmf.supabase.co

echo.
echo ================================================
echo If you see replies above, it's WORKING!
echo If not, restart your computer and try again.
echo ================================================
echo.
pause
