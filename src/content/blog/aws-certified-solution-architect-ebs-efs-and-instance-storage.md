---
title: "AWS Certified Solution Architect — EBS, EFS and Instance Storage"
date: "2022-04-18"
preview: "Hi Guys, In the last tutorial we talked about EC2. So for every EC2 there is a storage facility available. As an architect you should be…"
description: "EBS, EFS, and instance store compared for the AWS Solution Architect exam: durability, sharing between instances, and picking the right one."
tags: ["aws", "databases"]
mediumUrl: "https://medium.com/@billacode/aws-certified-solution-architect-ebs-efs-and-instance-storage-57b17d540ba8"
syndicated: false  # short but complete, not a summary stub
---
Hi Guys, In the last tutorial we talked about EC2. So for every EC2 there is a storage facility available. As an architect you should be able to find the optimum solution for your requirement. For that let’s dive deep in to what these different storage mechanisms offer.

EBS is a network drive which we can attach to our instances while it runs. EC2 instance stores are attached to the EC2 instances, depending on the size of the instance, performance vary. EFS are managed network file systems(NFS) which we mount to one or many EC2.

Now we know the basic definition of these storage techniques, Now let’s see the use cases.

When You have a fleet of EC2 instances distributes across AZs (Available Zones) that process a large data set and need to access a same data set then we will have to use EFS over other techniques. This is because EBS can be created only for one AZ. One other benefit of EFS is scalability.

When we need a redundant safe data storage with high performance then EBS is good to use. This is used like a normal HDD.

Instance storage is similar to the RAM and this can be used for high-performance database storage kind of requirements but all the data should be backed up regularly. When the EC2 instance is terminated the storage is deleted. Actually instance storage used like a high-performance local cache for your application hosted on an EC2 instance.
