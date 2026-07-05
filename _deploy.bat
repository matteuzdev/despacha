@echo off
cd /d C:\Users\hiant\Documents\CODE\despacha

:: Remove locks
del /f /q .git\index.lock 2>nul
del /f /q C:\Users\hiant\.git\index.lock 2>nul

:: Add, commit, push
git add -A
git commit -m "Deploy: Despacha app completo"
git remote add origin https://github.com/matteuzdev/despacha.git 2>nul
git push -u origin master
echo DONE
