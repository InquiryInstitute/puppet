# Cloning Puppet Repository to ~/GitHub

The puppet repository has been initialized with git. To clone it to `~/GitHub` as a separate repository:

## Option 1: Create GitHub Repository and Push

1. Create a new repository on GitHub (e.g., `InquiryInstitute/puppet`)

2. Add the remote and push:
```bash
cd /Users/danielmcshan/GitHub/Inquiry.Institute/puppet
git remote add origin git@github.com:InquiryInstitute/puppet.git
git branch -M main
git push -u origin main
```

3. Clone to ~/GitHub:
```bash
cd ~/GitHub
git clone git@github.com:InquiryInstitute/puppet.git
```

## Option 2: Copy as Standalone Repository

If you want to copy it directly to ~/GitHub without GitHub:

```bash
# Copy the entire puppet directory
cp -r /Users/danielmcshan/GitHub/Inquiry.Institute/puppet ~/GitHub/puppet

# The git repository is already initialized, so it's ready to use
cd ~/GitHub/puppet
```

## Option 3: Use as Submodule

If you want to keep it in Inquiry.Institute but also have it in ~/GitHub:

1. First, push to GitHub (see Option 1)
2. Then add it as a submodule in Inquiry.Institute:
```bash
cd /Users/danielmcshan/GitHub/Inquiry.Institute
git submodule add git@github.com:InquiryInstitute/puppet.git puppet
```

3. Clone separately to ~/GitHub:
```bash
cd ~/GitHub
git clone git@github.com:InquiryInstitute/puppet.git
```

## Current Status

The repository is initialized with:
- ✅ All source files committed
- ✅ Git repository ready
- ✅ Ready to push to GitHub or copy
