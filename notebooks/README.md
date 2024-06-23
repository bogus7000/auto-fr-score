# Notebooks

Jupyter notebooks workspace for data analysis, visualization, and model training

1. Requirements:
	- `Python v3.12.3`
	- `pip`
	- `venv`
2. Prepare environment:
```bash
# From repository root
cd notebooks

# Create virtual environment
python -m venv auto-fr-venv

# Activate virtual environment
source auto-fr-venv/bin/activate

# Install dependencies
cat requirements.txt
python -m pip install -r requirements.txt

# Install kernel for Jupyter
python -m ipykernel install --user --name=auto-fr-venv
python -m bash_kernel.install

# Start Jupyter notebook
jupyter notebook
```
3. Open a browser window with the Jupyter interface. Navigate to the notebook or create a new one. Use the `auto-fr-env` kernel
4. Alternatively, work with the notebooks inside `VsCode`. Use the `auto-fr-env` kernel
5. `exploration.ipynb` contains the data exploration and visualizations code
6. `auto-fr.ipynb` contains the model training and evaluation code
7. `auto-description.ipynb` contains the the description generation code. This notebook requires api key for OpenAI API. You can set the key in the notebook
8. With the virtual environment activated, you can render the `.md` files in this repository using `grip`:
```bash
grip REPORT.md
```
9.  Deactivate virtual environment
```bash
# Inside the activated virtual environment
deactivate
```